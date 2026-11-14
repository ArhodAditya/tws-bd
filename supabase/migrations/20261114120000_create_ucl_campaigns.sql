-- UCL campaigns: one row per European Cup / UEFA Champions League title Real
-- Madrid have won. Drives the Fans Zone "Reyes de Europa" globe and is edited
-- from the admin panel at /admin/ucl-history, so the site owner can write the
-- long-form history of each campaign and attach a photo without a deploy.
--
-- Idempotent: safe to run more than once. The seed never overwrites a row that
-- already exists, so re-running it cannot clobber anything written in the CMS.

create table if not exists public.ucl_campaigns (
  id uuid primary key default gen_random_uuid(),
  -- Calendar year the final was played. One title per year, so it doubles as
  -- the natural key the seed below upserts on.
  year integer not null unique check (year between 1955 and 2100),
  city text not null,
  -- Stadium position in decimal degrees.
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  -- The name the win is remembered by, e.g. 'La Décima'.
  title text not null,
  opponent text not null,
  -- Real Madrid's goals first: '4-3', '3-2 (aet)', '1-1 (5-3 pens)'.
  score text not null,
  -- The players (and coaches) who decided the final.
  heroes text,
  -- The road to the final, one round per line.
  route text,
  -- Long-form story of the campaign, in Markdown. Can run to many thousands of
  -- words, which is why the Fans Zone loads it on demand rather than up front.
  detailed_history text,
  -- Photo of the final (a Cloudinary URL uploaded from the admin panel).
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS. The table is public editorial content, so anyone (including anon) may
-- read it. There are deliberately NO insert / update / delete policies: every
-- write goes through an admin-gated Server Action using the service-role
-- client, which bypasses RLS. That is the same write path the news articles
-- use, and it avoids a policy that sub-selects `profiles.role` — a column
-- anon / authenticated can no longer read, so such a policy errors for
-- signed-in visitors.
alter table public.ucl_campaigns enable row level security;

drop policy if exists "Anyone can read UCL campaigns" on public.ucl_campaigns;
create policy "Anyone can read UCL campaigns"
  on public.ucl_campaigns
  for select
  using (true);

-- Seed: the fifteen titles, 1956–2024. `detailed_history` starts as a one-line
-- summary and `image_url` is left null — both are filled in from the admin
-- panel. `route` uses an escape string so each round sits on its own line.
insert into public.ucl_campaigns
  (year, city, lat, lng, title, opponent, score, heroes, route, detailed_history)
values
  (1956, 'Paris', 48.8414, 2.253, 'The First Crown', 'Stade de Reims', '4-3', 'Héctor Rial (2 goals), Alfredo Di Stéfano, Marquitos', E'First round: Servette, 7–0 on aggregate\nQuarter-final: Partizan, 4–3 on aggregate\nSemi-final: AC Milan, 5–4 on aggregate', 'The birth of a dynasty. Real Madrid fought back from a 2-0 deficit in the inaugural European Cup final at the Parc des Princes.'),
  (1957, 'Madrid', 40.4531, -3.6883, 'Glory at Home', 'Fiorentina', '2-0', 'Alfredo Di Stéfano (penalty), Francisco Gento', E'First round: Rapid Wien, 5–5 on aggregate, then 2–0 in the play-off\nQuarter-final: Nice, 6–2 on aggregate\nSemi-final: Manchester United, 5–3 on aggregate', 'Played at the Santiago Bernabéu, Di Stéfano and Gento secured back-to-back titles in front of 124,000 roaring Madridistas.'),
  (1958, 'Brussels', 50.8955, 4.3339, 'The Three-peat', 'AC Milan', '3-2 (aet)', 'Alfredo Di Stéfano, Héctor Rial, Francisco Gento (extra-time winner)', E'First round: Royal Antwerp, 8–1 on aggregate\nQuarter-final: Sevilla, 10–2 on aggregate\nSemi-final: Vasas, 4–2 on aggregate', 'A grueling battle in Brussels. Paco Gento''s extra-time winner secured the third consecutive European Cup.'),
  (1959, 'Stuttgart', 48.7923, 9.232, 'Four in a Row', 'Stade de Reims', '2-0', 'Enrique Mateos, Alfredo Di Stéfano', E'First round: Beşiktaş, 3–1 on aggregate\nQuarter-final: Wiener Sport-Club, 7–1 on aggregate\nSemi-final: Atlético Madrid, 2–2 on aggregate, then 2–1 in the play-off', 'A repeat of the first final. Even with Puskás absent, Mateos and Di Stéfano ensured the trophy stayed in Madrid.'),
  (1960, 'Glasgow', 55.8258, -4.252, 'The Greatest Final', 'Eintracht Frankfurt', '7-3', 'Ferenc Puskás (4 goals), Alfredo Di Stéfano (hat-trick)', E'First round: Jeunesse Esch, 12–2 on aggregate\nQuarter-final: Nice, 6–3 on aggregate\nSemi-final: Barcelona, 6–2 on aggregate', 'Widely considered the greatest final ever played. Puskás scored four and Di Stéfano three in front of 127,000 fans at Hampden Park.'),
  (1966, 'Brussels', 50.8955, 4.3339, 'The Ye-yé Team', 'Partizan', '2-1', 'Amancio Amaro, Fernando Serena, captain Francisco Gento', E'Preliminary round: Feyenoord, 6–2 on aggregate\nFirst round: Kilmarnock, 7–3 on aggregate\nQuarter-final: Anderlecht, 4–3 on aggregate\nSemi-final: Inter Milan, 2–1 on aggregate', 'Led by a veteran Gento and a squad of entirely Spanish players, Madrid came from behind to win their 6th crown.'),
  (1998, 'Amsterdam', 52.3144, 4.9419, 'La Séptima', 'Juventus', '1-0', 'Predrag Mijatović (winning goal), coach Jupp Heynckes', E'Group stage: winners of Group D, ahead of Rosenborg, Olympiacos and Porto\nQuarter-final: Bayer Leverkusen, 4–1 on aggregate\nSemi-final: Borussia Dortmund, 2–0 on aggregate', 'The 32-year wait ended. Predrag Mijatović''s iconic goal returned Real Madrid to their rightful throne in Europe.'),
  (2000, 'Paris', 48.9245, 2.36, 'La Octava', 'Valencia', '3-0', 'Fernando Morientes, Steve McManaman, Raúl, coach Vicente del Bosque', E'First group stage: winners of Group E, ahead of Porto, Olympiacos and Molde\nSecond group stage: runners-up in Group C, behind Bayern Munich\nQuarter-final: Manchester United, 3–2 on aggregate\nSemi-final: Bayern Munich, 3–2 on aggregate', 'The first ever final between two clubs from the same country. Raúl''s breakaway goal sealed a dominant victory.'),
  (2002, 'Glasgow', 55.8258, -4.252, 'La Novena', 'Bayer Leverkusen', '2-1', 'Raúl, Zinédine Zidane (the volley), Iker Casillas (late saves off the bench)', E'First group stage: winners of Group A, ahead of Roma, Lokomotiv Moscow and Anderlecht\nSecond group stage: winners of Group C, ahead of Panathinaikos, Sparta Prague and Porto\nQuarter-final: Bayern Munich, 3–2 on aggregate\nSemi-final: Barcelona, 3–1 on aggregate', 'Defined by Zinédine Zidane''s impossible left-footed volley—arguably the most beautiful goal in Champions League history.'),
  (2014, 'Lisbon', 38.7526, -9.183, 'La Décima', 'Atlético Madrid', '4-1 (aet)', 'Sergio Ramos (92:48 equaliser), Gareth Bale, Marcelo, Cristiano Ronaldo (penalty), Ángel Di María', E'Group stage: winners of Group B, ahead of Galatasaray, Juventus and Copenhagen\nRound of 16: Schalke 04, 9–2 on aggregate\nQuarter-final: Borussia Dortmund, 3–2 on aggregate\nSemi-final: Bayern Munich, 5–0 on aggregate', 'The obsession ended at 92:48. Sergio Ramos'' historic header forced extra time, breaking Atlético hearts.'),
  (2016, 'Milan', 45.4781, 9.124, 'La Undécima', 'Atlético Madrid', '1-1 (5-3 pens)', 'Sergio Ramos (goal), Cristiano Ronaldo (decisive penalty), coach Zinédine Zidane', E'Group stage: winners of Group A, ahead of Paris Saint-Germain, Shakhtar Donetsk and Malmö\nRound of 16: Roma, 4–0 on aggregate\nQuarter-final: Wolfsburg, 3–2 on aggregate\nSemi-final: Manchester City, 1–0 on aggregate', 'Another agonizing derby final. Cristiano Ronaldo scored the winning penalty in the shootout at the San Siro.'),
  (2017, 'Cardiff', 51.4783, -3.1826, 'La Duodécima', 'Juventus', '4-1', 'Cristiano Ronaldo (2 goals), Casemiro, Marco Asensio', E'Group stage: runners-up in Group F, behind Borussia Dortmund\nRound of 16: Napoli, 6–2 on aggregate\nQuarter-final: Bayern Munich, 6–3 on aggregate after extra time\nSemi-final: Atlético Madrid, 4–2 on aggregate', 'Madrid became the first team to defend the Champions League in the modern era, crushing Juventus with a masterclass half.'),
  (2018, 'Kyiv', 50.4334, 30.5219, 'La Decimotercera', 'Liverpool', '3-1', 'Gareth Bale (2 goals, one an overhead kick), Karim Benzema', E'Group stage: runners-up in Group H, behind Tottenham Hotspur\nRound of 16: Paris Saint-Germain, 5–2 on aggregate\nQuarter-final: Juventus, 4–3 on aggregate\nSemi-final: Bayern Munich, 4–3 on aggregate', 'A historic three-peat under Zidane, sealed by Gareth Bale''s spectacular overhead kick.'),
  (2022, 'Paris', 48.9245, 2.36, 'La Decimocuarta', 'Liverpool', '1-0', 'Vinícius Júnior (winning goal), Thibaut Courtois (nine saves)', E'Group stage: winners of Group D, ahead of Inter Milan, Sheriff Tiraspol and Shakhtar Donetsk\nRound of 16: Paris Saint-Germain, 3–2 on aggregate\nQuarter-final: Chelsea, 5–4 on aggregate after extra time\nSemi-final: Manchester City, 6–5 on aggregate after extra time', 'The campaign of miracles. After insane comebacks against PSG, Chelsea, and City, Vini Jr. and a Courtois masterclass won the final.'),
  (2024, 'London', 51.556, -0.2795, 'La Quince', 'Borussia Dortmund', '2-0', 'Dani Carvajal, Vinícius Júnior, Toni Kroos in his final match for the club', E'Group stage: winners of Group C, ahead of Napoli, Braga and Union Berlin\nRound of 16: RB Leipzig, 2–1 on aggregate\nQuarter-final: Manchester City, 4–4 on aggregate, 4–3 on penalties\nSemi-final: Bayern Munich, 4–3 on aggregate', 'Carvajal and Vinícius struck late at Wembley, securing the 15th title and bidding a perfect farewell to Toni Kroos.')
on conflict (year) do nothing;
