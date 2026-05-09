export interface Customer {
  customerId: number;
  firstName:  string;
  lastName:   string;
  email:      string;
  phone:      string;
  role:       string;
}

export interface RegisterRequest {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  phone:     string;
}