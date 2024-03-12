export class PaymentOrderRto {
  paymentId: string;
  urlCheckout: string;

  constructor(order: { id: string; links: Array<{ href: string; rel: 'payer-action' | 'approval_url' }> }) {
    const link = order.links.find(({ rel }) => rel === 'payer-action');

    if (!link) {
      throw new Error('Not Found Payer Action Link');
    }

    this.paymentId = order.id;
    this.urlCheckout = link.href;
  }
}
