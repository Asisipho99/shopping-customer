export interface OrderItem {
  productId:   number;
  productName: string;
  quantity:    number;
  unitPrice:   number;
}

export interface Order {
  orderId:     number;
  customerId:  number;
  totalAmount: number;
  status:      string;
  createdAt:   string;
  items:       OrderItem[];
}

export interface PlaceOrderRequest {
  customerId:    number;
  customerEmail: string;
  items: {
    productId:   number;
    productName: string;
    quantity:    number;
    unitPrice:   number;
  }[];
}