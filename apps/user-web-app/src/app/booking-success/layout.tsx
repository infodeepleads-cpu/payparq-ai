import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Confirmed | PayParq',
  description: 'Your parking booking has been confirmed. Check your email for details and visit the location to activate your reservation.',
};

export default function BookingSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
