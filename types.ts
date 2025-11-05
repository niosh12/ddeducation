import { Timestamp } from 'firebase/firestore';

export enum SubmissionStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Processing = 'Processing',
  Verified = 'Verified',
  Uploaded = 'Uploaded',
  Rejected = 'Rejected',
}

export interface StudentSubmission {
  id: string; // The doc id, which is the user's uid
  uid: string;
  class: '10th' | '12th';
  fullName: string;
  email: string;
  enrollmentNumber?: string;
  dob?: string;
  session?: string;
  subjects?: string[];
  paymentRef?: string;
  paymentImageBase64?: string;
  comments?: string;
  status: SubmissionStatus;
  adminReply?: string;
  adminProofLink?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface AppConfig {
    price: number;
}
