// The fifteen titles as shipped in the database seed
// (supabase/migrations/20261114120000_create_ucl_campaigns.sql).
//
// This copy is the Fans Zone's fallback: until that migration has been run —
// or if the table can't be read — the globe renders from here, so the page is
// never empty. Keep the two in step when a title is added; the admin panel is
// where the real content lives.

export interface SeedCampaign {
  readonly year: number;
  readonly city: string;
  readonly lat: number;
  readonly lng: number;
  readonly title: string;
  readonly opponent: string;
  readonly score: string;
  readonly heroes: string;
  /** One round per line. */
  readonly route: string;
  readonly detailed_history: string;
}

export const SEED_CAMPAIGNS: readonly SeedCampaign[] = [
  {
    year: 1956,
    city: "Paris",
    lat: 48.8414,
    lng: 2.253,
    title: "The First Crown",
    opponent: "Stade de Reims",
    score: "4-3",
    heroes: "Héctor Rial (2 goals), Alfredo Di Stéfano, Marquitos",
    route: [
      "First round: Servette, 7–0 on aggregate",
      "Quarter-final: Partizan, 4–3 on aggregate",
      "Semi-final: AC Milan, 5–4 on aggregate",
    ].join("\n"),
    detailed_history:
      "The birth of a dynasty. Real Madrid fought back from a 2-0 deficit in the inaugural European Cup final at the Parc des Princes.",
  },
  {
    year: 1957,
    city: "Madrid",
    lat: 40.4531,
    lng: -3.6883,
    title: "Glory at Home",
    opponent: "Fiorentina",
    score: "2-0",
    heroes: "Alfredo Di Stéfano (penalty), Francisco Gento",
    route: [
      "First round: Rapid Wien, 5–5 on aggregate, then 2–0 in the play-off",
      "Quarter-final: Nice, 6–2 on aggregate",
      "Semi-final: Manchester United, 5–3 on aggregate",
    ].join("\n"),
    detailed_history:
      "Played at the Santiago Bernabéu, Di Stéfano and Gento secured back-to-back titles in front of 124,000 roaring Madridistas.",
  },
  {
    year: 1958,
    city: "Brussels",
    lat: 50.8955,
    lng: 4.3339,
    title: "The Three-peat",
    opponent: "AC Milan",
    score: "3-2 (aet)",
    heroes: "Alfredo Di Stéfano, Héctor Rial, Francisco Gento (extra-time winner)",
    route: [
      "First round: Royal Antwerp, 8–1 on aggregate",
      "Quarter-final: Sevilla, 10–2 on aggregate",
      "Semi-final: Vasas, 4–2 on aggregate",
    ].join("\n"),
    detailed_history:
      "A grueling battle in Brussels. Paco Gento's extra-time winner secured the third consecutive European Cup.",
  },
  {
    year: 1959,
    city: "Stuttgart",
    lat: 48.7923,
    lng: 9.232,
    title: "Four in a Row",
    opponent: "Stade de Reims",
    score: "2-0",
    heroes: "Enrique Mateos, Alfredo Di Stéfano",
    route: [
      "First round: Beşiktaş, 3–1 on aggregate",
      "Quarter-final: Wiener Sport-Club, 7–1 on aggregate",
      "Semi-final: Atlético Madrid, 2–2 on aggregate, then 2–1 in the play-off",
    ].join("\n"),
    detailed_history:
      "A repeat of the first final. Even with Puskás absent, Mateos and Di Stéfano ensured the trophy stayed in Madrid.",
  },
  {
    year: 1960,
    city: "Glasgow",
    lat: 55.8258,
    lng: -4.252,
    title: "The Greatest Final",
    opponent: "Eintracht Frankfurt",
    score: "7-3",
    heroes: "Ferenc Puskás (4 goals), Alfredo Di Stéfano (hat-trick)",
    route: [
      "First round: Jeunesse Esch, 12–2 on aggregate",
      "Quarter-final: Nice, 6–3 on aggregate",
      "Semi-final: Barcelona, 6–2 on aggregate",
    ].join("\n"),
    detailed_history:
      "Widely considered the greatest final ever played. Puskás scored four and Di Stéfano three in front of 127,000 fans at Hampden Park.",
  },
  {
    year: 1966,
    city: "Brussels",
    lat: 50.8955,
    lng: 4.3339,
    title: "The Ye-yé Team",
    opponent: "Partizan",
    score: "2-1",
    heroes: "Amancio Amaro, Fernando Serena, captain Francisco Gento",
    route: [
      "Preliminary round: Feyenoord, 6–2 on aggregate",
      "First round: Kilmarnock, 7–3 on aggregate",
      "Quarter-final: Anderlecht, 4–3 on aggregate",
      "Semi-final: Inter Milan, 2–1 on aggregate",
    ].join("\n"),
    detailed_history:
      "Led by a veteran Gento and a squad of entirely Spanish players, Madrid came from behind to win their 6th crown.",
  },
  {
    year: 1998,
    city: "Amsterdam",
    lat: 52.3144,
    lng: 4.9419,
    title: "La Séptima",
    opponent: "Juventus",
    score: "1-0",
    heroes: "Predrag Mijatović (winning goal), coach Jupp Heynckes",
    route: [
      "Group stage: winners of Group D, ahead of Rosenborg, Olympiacos and Porto",
      "Quarter-final: Bayer Leverkusen, 4–1 on aggregate",
      "Semi-final: Borussia Dortmund, 2–0 on aggregate",
    ].join("\n"),
    detailed_history:
      "The 32-year wait ended. Predrag Mijatović's iconic goal returned Real Madrid to their rightful throne in Europe.",
  },
  {
    year: 2000,
    city: "Paris",
    lat: 48.9245,
    lng: 2.36,
    title: "La Octava",
    opponent: "Valencia",
    score: "3-0",
    heroes: "Fernando Morientes, Steve McManaman, Raúl, coach Vicente del Bosque",
    route: [
      "First group stage: winners of Group E, ahead of Porto, Olympiacos and Molde",
      "Second group stage: runners-up in Group C, behind Bayern Munich",
      "Quarter-final: Manchester United, 3–2 on aggregate",
      "Semi-final: Bayern Munich, 3–2 on aggregate",
    ].join("\n"),
    detailed_history:
      "The first ever final between two clubs from the same country. Raúl's breakaway goal sealed a dominant victory.",
  },
  {
    year: 2002,
    city: "Glasgow",
    lat: 55.8258,
    lng: -4.252,
    title: "La Novena",
    opponent: "Bayer Leverkusen",
    score: "2-1",
    heroes: "Raúl, Zinédine Zidane (the volley), Iker Casillas (late saves off the bench)",
    route: [
      "First group stage: winners of Group A, ahead of Roma, Lokomotiv Moscow and Anderlecht",
      "Second group stage: winners of Group C, ahead of Panathinaikos, Sparta Prague and Porto",
      "Quarter-final: Bayern Munich, 3–2 on aggregate",
      "Semi-final: Barcelona, 3–1 on aggregate",
    ].join("\n"),
    detailed_history:
      "Defined by Zinédine Zidane's impossible left-footed volley—arguably the most beautiful goal in Champions League history.",
  },
  {
    year: 2014,
    city: "Lisbon",
    lat: 38.7526,
    lng: -9.183,
    title: "La Décima",
    opponent: "Atlético Madrid",
    score: "4-1 (aet)",
    heroes: "Sergio Ramos (92:48 equaliser), Gareth Bale, Marcelo, Cristiano Ronaldo (penalty), Ángel Di María",
    route: [
      "Group stage: winners of Group B, ahead of Galatasaray, Juventus and Copenhagen",
      "Round of 16: Schalke 04, 9–2 on aggregate",
      "Quarter-final: Borussia Dortmund, 3–2 on aggregate",
      "Semi-final: Bayern Munich, 5–0 on aggregate",
    ].join("\n"),
    detailed_history:
      "The obsession ended at 92:48. Sergio Ramos' historic header forced extra time, breaking Atlético hearts.",
  },
  {
    year: 2016,
    city: "Milan",
    lat: 45.4781,
    lng: 9.124,
    title: "La Undécima",
    opponent: "Atlético Madrid",
    score: "1-1 (5-3 pens)",
    heroes: "Sergio Ramos (goal), Cristiano Ronaldo (decisive penalty), coach Zinédine Zidane",
    route: [
      "Group stage: winners of Group A, ahead of Paris Saint-Germain, Shakhtar Donetsk and Malmö",
      "Round of 16: Roma, 4–0 on aggregate",
      "Quarter-final: Wolfsburg, 3–2 on aggregate",
      "Semi-final: Manchester City, 1–0 on aggregate",
    ].join("\n"),
    detailed_history:
      "Another agonizing derby final. Cristiano Ronaldo scored the winning penalty in the shootout at the San Siro.",
  },
  {
    year: 2017,
    city: "Cardiff",
    lat: 51.4783,
    lng: -3.1826,
    title: "La Duodécima",
    opponent: "Juventus",
    score: "4-1",
    heroes: "Cristiano Ronaldo (2 goals), Casemiro, Marco Asensio",
    route: [
      "Group stage: runners-up in Group F, behind Borussia Dortmund",
      "Round of 16: Napoli, 6–2 on aggregate",
      "Quarter-final: Bayern Munich, 6–3 on aggregate after extra time",
      "Semi-final: Atlético Madrid, 4–2 on aggregate",
    ].join("\n"),
    detailed_history:
      "Madrid became the first team to defend the Champions League in the modern era, crushing Juventus with a masterclass half.",
  },
  {
    year: 2018,
    city: "Kyiv",
    lat: 50.4334,
    lng: 30.5219,
    title: "La Decimotercera",
    opponent: "Liverpool",
    score: "3-1",
    heroes: "Gareth Bale (2 goals, one an overhead kick), Karim Benzema",
    route: [
      "Group stage: runners-up in Group H, behind Tottenham Hotspur",
      "Round of 16: Paris Saint-Germain, 5–2 on aggregate",
      "Quarter-final: Juventus, 4–3 on aggregate",
      "Semi-final: Bayern Munich, 4–3 on aggregate",
    ].join("\n"),
    detailed_history:
      "A historic three-peat under Zidane, sealed by Gareth Bale's spectacular overhead kick.",
  },
  {
    year: 2022,
    city: "Paris",
    lat: 48.9245,
    lng: 2.36,
    title: "La Decimocuarta",
    opponent: "Liverpool",
    score: "1-0",
    heroes: "Vinícius Júnior (winning goal), Thibaut Courtois (nine saves)",
    route: [
      "Group stage: winners of Group D, ahead of Inter Milan, Sheriff Tiraspol and Shakhtar Donetsk",
      "Round of 16: Paris Saint-Germain, 3–2 on aggregate",
      "Quarter-final: Chelsea, 5–4 on aggregate after extra time",
      "Semi-final: Manchester City, 6–5 on aggregate after extra time",
    ].join("\n"),
    detailed_history:
      "The campaign of miracles. After insane comebacks against PSG, Chelsea, and City, Vini Jr. and a Courtois masterclass won the final.",
  },
  {
    year: 2024,
    city: "London",
    lat: 51.556,
    lng: -0.2795,
    title: "La Quince",
    opponent: "Borussia Dortmund",
    score: "2-0",
    heroes: "Dani Carvajal, Vinícius Júnior, Toni Kroos in his final match for the club",
    route: [
      "Group stage: winners of Group C, ahead of Napoli, Braga and Union Berlin",
      "Round of 16: RB Leipzig, 2–1 on aggregate",
      "Quarter-final: Manchester City, 4–4 on aggregate, 4–3 on penalties",
      "Semi-final: Bayern Munich, 4–3 on aggregate",
    ].join("\n"),
    detailed_history:
      "Carvajal and Vinícius struck late at Wembley, securing the 15th title and bidding a perfect farewell to Toni Kroos.",
  },
];
