export const budgetDestinations = [
    {
        city: 'Paris',
        country: 'France',
        price: '58 000',
        image: '/assets/flights/paris.webp',
    },
    {
        city: 'Marseille',
        country: 'France',
        price: '68 000',
        image: '/assets/flights/marseille.webp',
    },
    {
        city: 'Pise',
        country: 'Italie',
        price: '100 000',
        image: '/assets/flights/pisa.webp',
    },
    {
        city: 'Santorin',
        country: 'Grèce',
        price: '154 000',
        image: '/assets/flights/santorin.webp',
    },
];

export const budgetOptions = [
    '50 000 DZD',
    '100 000 DZD',
    '155 000 DZD',
    '200 000 DZD',
    '300 000 DZD',
];

export interface PriceDrop {
    originCity: string;
    originCode: string;
    destCity: string;
    destCode: string;
    oldPrice: string;
    newPrice: string;
    departDate: string;
    seatsRemaining?: number;
}

export const priceDrops: PriceDrop[] = [
    {
        originCity: 'Alger', originCode: 'ALG',
        destCity: 'Montréal', destCode: 'YUL',
        oldPrice: '158 000', newPrice: '145 000',
        departDate: '28 juil',
    },
    {
        originCity: 'Alger', originCode: 'ALG',
        destCity: 'Paris', destCode: 'CDG',
        oldPrice: '32 000', newPrice: '29 000',
        departDate: '28 juil',
        seatsRemaining: 2,
    },
    {
        originCity: 'Alger', originCode: 'ALG',
        destCity: 'Istanbul', destCode: 'IST',
        oldPrice: '87 000', newPrice: '72 000',
        departDate: '28 juil',
    },
];