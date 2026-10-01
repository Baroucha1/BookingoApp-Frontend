import { useIsMobile } from './SearchFormShared';
import MobileSearchForm from './MobileSearchForm';
import DesktopSearchForm from './DesktopSearchForm';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';

export default function AggregatedSearchForm({ onSubmit, loading }: { onSubmit: (p: AggregatedSearchParams) => void; loading?: boolean }) {
    const isMobile = useIsMobile();
    return isMobile
        ? <MobileSearchForm onSubmit={onSubmit} loading={loading} />
        : <DesktopSearchForm onSubmit={onSubmit} loading={loading} />;
}