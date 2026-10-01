// src/service/flights_aggregator/summaryAdapter.ts
import type { DisplayOffer } from './aggregatedNormalize';
import {AggregatedSearchParams} from "@/service/flights_aggregator/aggregatedTypes.ts";
import {SearchParams} from "@/service/flights/types.ts";

export function toSummaryFlight(offer: DisplayOffer) {
    const outbound = offer.legs[0];
    const inbound = offer.legs[1];

    return {
        airlineName: offer.airlineName,
        airlineCode: offer.airlineCode,
        cabinClass: offer.cabinName,
        isRoundTrip: offer.legs.length > 1,
        departureTime: outbound.departureTime,
        totalTime: outbound.durationLabel,
        isDirect: outbound.isDirect,
        nbStop: outbound.stopsLabel,
        arrivalTime: outbound.arrivalTime,
        returnDepartureTime: inbound?.departureTime,
        returnDepartureCode: inbound?.originAirport,
        returnTotalTime: inbound?.durationLabel,
        returnIsDirect: inbound?.isDirect,
        returnNbStop: inbound?.stopsLabel,
        returnArrivalTime: inbound?.arrivalTime,
        returnArrivalCode: inbound?.destinationAirport,
        baggage: offer.checkedBaggage,
    };
}

// searchParamsLike: only the fields FlightSummaryCard actually reads.
// adults/children/infants counts must come from whatever the search form
// collected — plug in the real field names once confirmed.
export function toSummarySearchParams(offer: DisplayOffer, searchParams: AggregatedSearchParams | null): SearchParams {
    const outbound = offer.legs[0];
    const inbound = offer.legs[1];

    return {
        departVol1: outbound.originAirport,
        destinationVol1: outbound.destinationAirport,
        departleVol1: outbound.departureDate,
        retourleVol1: inbound?.departureDate ?? '',
        qteADT: searchParams?.adults ?? 1,
        qteCHD: searchParams?.children ?? 0,
        qteINF: searchParams?.infants ?? 0,
    } as SearchParams;
}