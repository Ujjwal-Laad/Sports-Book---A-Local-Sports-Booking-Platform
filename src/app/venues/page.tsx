import Venues from '@/components/venues/Venues';
import { Suspense } from 'react';

export default function VenuesPage() {
  return (
    <Suspense>
      <Venues />
    </Suspense>
  );
}
