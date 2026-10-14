import os
import hmac
import hashlib
import json
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import razorpay
import stripe


RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')


@csrf_exempt
@require_POST
def razorpay_webhook(request):
    signature = request.headers.get('X-Razorpay-Signature')
    if not signature:
        return HttpResponseBadRequest('Missing signature')

    payload = request.body.decode('utf-8')

    try:
        client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), RAZORPAY_KEY_SECRET))
        client.utility.verify_webhook_signature(payload, signature, RAZORPAY_KEY_SECRET)
    except razorpay.errors.SignatureVerificationError:
        return HttpResponseBadRequest('Invalid signature')

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        return HttpResponseBadRequest('Invalid payload')

    event_type = event.get('event')

    if event_type == 'payment.authorized':
        handle_payment_authorized(event)
    elif event_type == 'payment.captured':
        handle_payment_captured(event)
    elif event_type == 'payment.failed':
        handle_payment_failed(event)
    elif event_type == 'refund.created':
        handle_refund_created(event)
    elif event_type == 'refund.processed':
        handle_refund_processed(event)

    return HttpResponse(status=200)


def handle_payment_authorized(event):
    payment = event['payload']['payment']['entity']
    payment_id = payment['id']

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'processing'
        txn.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_payment_captured(event):
    payment = event['payload']['payment']['entity']
    payment_id = payment['id']
    amount = payment['amount'] / 100

    from .models import PaymentTransaction, Order
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'completed'
        txn.save()

        if txn.order:
            txn.order.status = 'confirmed'
            txn.order.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_payment_failed(event):
    payment = event['payload']['payment']['entity']
    payment_id = payment['id']

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'failed'
        txn.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_refund_created(event):
    refund = event['payload']['refund']['entity']
    payment_id = refund['payment_id']

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'refunded'
        txn.save()

        if txn.order:
            txn.order.status = 'refunded'
            txn.order.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_refund_processed(event):
    pass


@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.headers.get('Stripe-Signature')

    if not sig_header:
        return HttpResponseBadRequest('Missing signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponseBadRequest('Invalid signature')

    if event['type'] == 'payment_intent.succeeded':
        handle_stripe_payment_succeeded(event['data']['object'])
    elif event['type'] == 'payment_intent.payment_failed':
        handle_stripe_payment_failed(event['data']['object'])
    elif event['type'] == 'charge.refunded':
        handle_stripe_charge_refunded(event['data']['object'])

    return HttpResponse(status=200)


def handle_stripe_payment_succeeded(payment_intent):
    payment_id = payment_intent['id']
    amount = payment_intent['amount'] / 100

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'completed'
        txn.save()

        if txn.order:
            txn.order.status = 'confirmed'
            txn.order.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_stripe_payment_failed(payment_intent):
    payment_id = payment_intent['id']

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'failed'
        txn.save()
    except PaymentTransaction.DoesNotExist:
        pass


def handle_stripe_charge_refunded(charge):
    payment_id = charge['payment_intent']

    from .models import PaymentTransaction
    try:
        txn = PaymentTransaction.objects.get(gateway_payment_id=payment_id)
        txn.status = 'refunded'
        txn.save()

        if txn.order:
            txn.order.status = 'refunded'
            txn.order.save()
    except PaymentTransaction.DoesNotExist:
        pass


def create_razorpay_order(amount, currency='INR', receipt=None):
    client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), RAZORPAY_KEY_SECRET))

    order = client.order.create({
        'amount': int(amount * 100),
        'currency': currency,
        'receipt': receipt,
    })

    return order


def verify_razorpay_payment(payment_id, order_id, signature):
    client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), RAZORPAY_KEY_SECRET))

    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature,
        })
        return True
    except:
        return False


def create_stripe_payment_intent(amount, currency='inr', metadata=None):
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

    intent = stripe.PaymentIntent.create(
        amount=int(amount * 100),
        currency=currency,
        metadata=metadata or {},
    )

    return intent
