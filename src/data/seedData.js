export const initialSeedData = {
  airports: [
    { AirportCode: 'KHI', AirportName: 'Jinnah Intl Airport', CityName: 'Karachi', CountryName: 'Pakistan' },
    { AirportCode: 'IKA', AirportName: 'Imam Khomeini Intl Airport', CityName: 'Tehran', CountryName: 'Iran' },
    { AirportCode: 'MHD', AirportName: 'Mashhad Intl Airport', CityName: 'Mashhad', CountryName: 'Iran' }
  ],
  airlines: [
    { AirlineCode: 'HH', AirlineName: 'Taban Airlines' },
    { AirlineCode: 'IR', AirlineName: 'Iran Air' },
    { AirlineCode: 'W5', AirlineName: 'Mahan Air' },
    { AirlineCode: 'EP', AirlineName: 'Iran Aseman Airlines' },
    { AirlineCode: 'QB', AirlineName: 'Qeshm Air' },
    { AirlineCode: 'PK', AirlineName: 'Pakistan International Airlines' },
    { AirlineCode: 'PA', AirlineName: 'Airblue' },
    { AirlineCode: 'ER', AirlineName: 'SereneAir' },
    { AirlineCode: '9P', AirlineName: 'Fly Jinnah' },
    { AirlineCode: 'PF', AirlineName: 'AirSial' }
  ],
  suppliers: [
    { SupplierID: 'SUP-01', Supplier_Name: 'Direct Airline Inventory' },
    { SupplierID: 'SUP-02', Supplier_Name: 'GDS Consolidator' },
    { SupplierID: 'SUP-03', Supplier_Name: 'Charter Block Desk' }
  ],
  segments: [],
  flights: [],
  subAgents: [],
  bookings: []
};
