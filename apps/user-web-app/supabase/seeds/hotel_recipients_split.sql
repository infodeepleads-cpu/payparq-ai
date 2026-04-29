-- Split area hotel recipients for cold campaign
insert into email_recipients (email, name, property_type, location) values
  ('management@hotelluxesplit.com', 'Hotel Luxe Split', 'hotel', 'Split'),
  ('info@ambasadorsplit.com', 'Hotel Ambasador Split', 'hotel', 'Split'),
  ('info@hotelparksplit.com', 'Hotel Park Split', 'hotel', 'Split'),
  ('info@cornarohotel.com', 'Cornaro Hotel Split', 'hotel', 'Split'),
  ('info.split@radissonblu.com', 'Radisson Blu Resort & Spa Split', 'hotel', 'Split'),
  ('info@vestibulpalace.com', 'Hotel Vestibul Palace', 'hotel', 'Split'),
  ('info@hotelslavija.hr', 'Hotel Slavija Split', 'hotel', 'Split'),
  ('booking@hotelperistil.com', 'Hotel Peristil', 'hotel', 'Split'),
  ('info@hotelglobo.com', 'Hotel Globo Split', 'hotel', 'Split'),
  ('info@lhjupiter.com', 'Jupiter Heritage Hotel Split', 'hotel', 'Split')
on conflict (email) do nothing;
