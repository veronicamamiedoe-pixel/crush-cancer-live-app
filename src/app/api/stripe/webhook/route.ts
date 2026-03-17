import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_SUPPORT_PRICE_ID || '']: 'support',
  [process.env.STRIPE_PREMIUM_PRICE_ID || '']: 'premium',
}

export async function POST(request: NextRequest) {
  const body     = await request.text()
  const sig      = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId  = session.metadata?.userId
        if (!userId || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price?.id
        const plan = PLAN_MAP[priceId] || 'free'

        await supabase.from('subscriptions').upsert({
          user_id:                userId,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan,
          status:                 'active',
          current_period_start:   new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' })

        await supabase.from('users').update({ plan }).eq('id', userId)

        // Send welcome notification
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'subscription',
          title: `Welcome to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan! 🎉`,
          message: `Your subscription is now active. You have full access to all ${plan} features.`,
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object as Stripe.Subscription
        const priceId = sub.items.data[0]?.price?.id
        const plan    = PLAN_MAP[priceId] || 'free'

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (existingSub) {
          await supabase.from('subscriptions').update({
            plan,
            status:               sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          }).eq('stripe_subscription_id', sub.id)

          await supabase.from('users').update({ plan }).eq('id', existingSub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (existingSub) {
          await supabase.from('subscriptions').update({
            plan: 'free', status: 'canceled'
          }).eq('stripe_subscription_id', sub.id)

          await supabase.from('users').update({ plan: 'free' }).eq('id', existingSub.user_id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (existingSub) {
          await supabase.from('subscriptions').update({ status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer as string)

          await supabase.from('notifications').insert({
            user_id: existingSub.user_id,
            type: 'billing',
            title: 'Payment failed',
            message: 'We could not process your subscription payment. Please update your billing details.',
            action_url: '/settings/billing',
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
