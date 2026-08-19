// PostAI — Prototype Post Office Dataset
// Prototype dataset — not for official use

const POST_OFFICES = [
  { id: 1,  name: "Anna Nagar H.O",                    pin: "600040", type: "Head Office", area: "Anna Nagar",        city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0850, lng: 80.2101, status: "Active" },
  { id: 2,  name: "Anna Nagar Western Extension S.O",  pin: "600101", type: "Sub Office",  area: "Anna Nagar West",   city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0952, lng: 80.1805, status: "Active" },
  { id: 3,  name: "Shenoy Nagar S.O",                  pin: "600030", type: "Sub Office",  area: "Shenoy Nagar",      city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0785, lng: 80.2250, status: "Active" },
  { id: 4,  name: "Aminjikarai S.O",                   pin: "600029", type: "Sub Office",  area: "Aminjikarai",       city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0718, lng: 80.2207, status: "Active" },
  { id: 5,  name: "Kilpauk H.O",                       pin: "600010", type: "Head Office", area: "Kilpauk",           city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0820, lng: 80.2410, status: "Active" },
  { id: 6,  name: "Nungambakkam H.O",                  pin: "600034", type: "Head Office", area: "Nungambakkam",      city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0569, lng: 80.2425, status: "Active" },
  { id: 7,  name: "T Nagar H.O",                       pin: "600017", type: "Head Office", area: "T Nagar",           city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0418, lng: 80.2341, status: "Active" },
  { id: 8,  name: "Mambalam R.S S.O",                  pin: "600033", type: "Sub Office",  area: "West Mambalam",     city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0335, lng: 80.2230, status: "Active" },
  { id: 9,  name: "Saidapet H.O",                      pin: "600015", type: "Head Office", area: "Saidapet",          city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0210, lng: 80.2208, status: "Active" },
  { id: 10, name: "Guindy Industrial Estate S.O",      pin: "600032", type: "Sub Office",  area: "Guindy",            city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0067, lng: 80.2206, status: "Active" },
  { id: 11, name: "Adyar S.O",                         pin: "600020", type: "Sub Office",  area: "Adyar",             city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0067, lng: 80.2572, status: "Active" },
  { id: 12, name: "Besant Nagar S.O",                  pin: "600090", type: "Sub Office",  area: "Besant Nagar",      city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0005, lng: 80.2668, status: "Active" },
  { id: 13, name: "Thiruvanmiyur S.O",                 pin: "600041", type: "Sub Office",  area: "Thiruvanmiyur",     city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9830, lng: 80.2594, status: "Active" },
  { id: 14, name: "Velachery H.O",                     pin: "600042", type: "Head Office", area: "Velachery",         city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9815, lng: 80.2180, status: "Active" },
  { id: 15, name: "Perungudi S.O",                     pin: "600096", type: "Sub Office",  area: "Perungudi",         city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9600, lng: 80.2475, status: "Active" },
  { id: 16, name: "Sholinganallur S.O",                pin: "600119", type: "Sub Office",  area: "Sholinganallur",    city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9010, lng: 80.2279, status: "Active" },
  { id: 17, name: "Tambaram H.O",                      pin: "600045", type: "Head Office", area: "Tambaram",          city: "Chengalpattu", district: "Chengalpattu", state: "Tamil Nadu", lat: 12.9249, lng: 80.1000, status: "Active" },
  { id: 18, name: "Chromepet S.O",                     pin: "600044", type: "Sub Office",  area: "Chromepet",         city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9516, lng: 80.1462, status: "Active" },
  { id: 19, name: "Pallavaram S.O",                    pin: "600043", type: "Sub Office",  area: "Pallavaram",        city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 12.9675, lng: 80.1491, status: "Active" },
  { id: 20, name: "Porur S.O",                         pin: "600116", type: "Sub Office",  area: "Porur",             city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0358, lng: 80.1565, status: "Active" },
  { id: 21, name: "Ambattur H.O",                      pin: "600053", type: "Head Office", area: "Ambattur",          city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.1143, lng: 80.1548, status: "Active" },
  { id: 22, name: "Avadi H.O",                         pin: "600054", type: "Head Office", area: "Avadi",             city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.1147, lng: 80.1098, status: "Active" },
  { id: 23, name: "Mogappair S.O",                     pin: "600037", type: "Sub Office",  area: "Mogappair",         city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0820, lng: 80.1720, status: "Active" },
  { id: 24, name: "Madhuravoyal S.O",                  pin: "600095", type: "Sub Office",  area: "Maduravoyal",       city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0604, lng: 80.1630, status: "Active" },
  { id: 25, name: "Poonamallee S.O",                   pin: "600056", type: "Sub Office",  area: "Poonamallee",       city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0475, lng: 80.1105, status: "Active" },
  { id: 26, name: "Triplicane H.O",                    pin: "600005", type: "Head Office", area: "Triplicane",        city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0588, lng: 80.2757, status: "Active" },
  { id: 27, name: "Royapettah H.O",                    pin: "600014", type: "Head Office", area: "Royapettah",        city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0522, lng: 80.2630, status: "Active" },
  { id: 28, name: "Mylapore H.O",                      pin: "600004", type: "Head Office", area: "Mylapore",          city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0337, lng: 80.2690, status: "Active" },
  { id: 29, name: "George Town H.O",                   pin: "600001", type: "Head Office", area: "George Town",       city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0878, lng: 80.2785, status: "Active" },
  { id: 30, name: "Park Town S.O",                     pin: "600003", type: "Sub Office",  area: "Park Town",         city: "Chennai",      district: "Chennai",      state: "Tamil Nadu", lat: 13.0827, lng: 80.2765, status: "Active" }
];

// Fallback coordinate lookup by area name (used when Nominatim is unavailable)
const AREA_COORDINATES = {
  "anna nagar":                { lat: 13.0860, lng: 80.2101 },
  "anna nagar west":           { lat: 13.0952, lng: 80.1805 },
  "anna nagar western":        { lat: 13.0952, lng: 80.1805 },
  "shenoy nagar":              { lat: 13.0785, lng: 80.2250 },
  "aminjikarai":               { lat: 13.0718, lng: 80.2207 },
  "kilpauk":                   { lat: 13.0820, lng: 80.2410 },
  "nungambakkam":              { lat: 13.0569, lng: 80.2425 },
  "t nagar":                   { lat: 13.0418, lng: 80.2341 },
  "mambalam":                  { lat: 13.0335, lng: 80.2230 },
  "west mambalam":             { lat: 13.0335, lng: 80.2230 },
  "saidapet":                  { lat: 13.0210, lng: 80.2208 },
  "guindy":                    { lat: 13.0067, lng: 80.2206 },
  "adyar":                     { lat: 13.0067, lng: 80.2572 },
  "besant nagar":              { lat: 13.0005, lng: 80.2668 },
  "thiruvanmiyur":             { lat: 12.9830, lng: 80.2594 },
  "velachery":                 { lat: 12.9815, lng: 80.2180 },
  "perungudi":                 { lat: 12.9600, lng: 80.2475 },
  "sholinganallur":            { lat: 12.9010, lng: 80.2279 },
  "tambaram":                  { lat: 12.9249, lng: 80.1000 },
  "chromepet":                 { lat: 12.9516, lng: 80.1462 },
  "pallavaram":                { lat: 12.9675, lng: 80.1491 },
  "porur":                     { lat: 13.0358, lng: 80.1565 },
  "ambattur":                  { lat: 13.1143, lng: 80.1548 },
  "avadi":                     { lat: 13.1147, lng: 80.1098 },
  "mogappair":                 { lat: 13.0820, lng: 80.1720 },
  "maduravoyal":               { lat: 13.0604, lng: 80.1630 },
  "madhuravoyal":              { lat: 13.0604, lng: 80.1630 },
  "poonamallee":               { lat: 13.0475, lng: 80.1105 },
  "triplicane":                { lat: 13.0588, lng: 80.2757 },
  "royapettah":                { lat: 13.0522, lng: 80.2630 },
  "mylapore":                  { lat: 13.0337, lng: 80.2690 },
  "george town":               { lat: 13.0878, lng: 80.2785 },
  "park town":                 { lat: 13.0827, lng: 80.2765 },
  "perambur":                  { lat: 13.1100, lng: 80.2457 },
  "kolathur":                  { lat: 13.1179, lng: 80.2135 },
  "villivakkam":               { lat: 13.1098, lng: 80.2099 },
  "chennai":                   { lat: 13.0827, lng: 80.2707 }
};

// Demo scenarios
const DEMO_SCENARIOS = {
  correct: {
    label: "Demo — Correct Address",
    address: "24 Gandhi Road, Anna Nagar, Chennai 600040"
  },
  mismatch: {
    label: "Demo — PIN Mismatch",
    address: "24 Gandhi Road, Anna Nagar, Chennai 600041"
  },
  incomplete: {
    label: "Demo — Incomplete Address",
    address: "Anna Nagar, Chennai"
  }
};
