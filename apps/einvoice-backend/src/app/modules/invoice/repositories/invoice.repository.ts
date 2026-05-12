import { Invoice, InvoiceModel, InvoiceModelName } from '@common/schemas/invoice.schema';
import { InjectModel } from '@nestjs/mongoose';

export class InvoiceRepository {
  constructor(@InjectModel(InvoiceModelName) private readonly invoiceModel: InvoiceModel) {}

  create(data: Partial<Invoice>) {
    return this.invoiceModel.create(data);
  }

  update(id: string, data: Partial<Invoice>) {
    return this.invoiceModel.findByIdAndUpdate(id, data, { new: true });
  }

  findById(id: string) {
    return this.invoiceModel.findById(id);
  }

  findAll() {
    return this.invoiceModel.find();
  }

  delete(id: string) {
    return this.invoiceModel.findByIdAndDelete(id);
  }
}
