import axios from 'axios';
import { getAccessToken } from '../support/auth.helper';
import { CreateInvoiceRequestDto, InvoiceResponseDTO } from '@common/interfaces/gateway/invoice';

describe('Invoice E2E(HTTPS)', () => {
  let accessToken: string;
  beforeAll(async () => {
    const authData = await getAccessToken();
    accessToken = authData.accessToken;
  });

  it('should create an invoice and send it', async () => {
    const createPayload: CreateInvoiceRequestDto = {
      client: {
        name: 'Client A',
        email: 'wibak82809@nriza.com', //change this for real email
        address: '123 St',
      },
      item: [
        {
          productId: 'prod_1',
          name: 'Product 1',
          quantity: 2,
          unitPrice: 100,
          vatRate: 0.1,
          total: 220, // (2*100) + 10% VAT
        },
      ],
    };

    const createRes = await axios.post<{ data: InvoiceResponseDTO }>(`/invoice`, createPayload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(createRes.status).toBe(201);
    const invoice = createRes.data.data;
    expect(invoice).toBeDefined();

    const sendRes = await axios.post(
      `/invoice/${invoice.id}/send`,
      {},
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    expect(sendRes.status).toBe(201);
  }, 10000);
});
