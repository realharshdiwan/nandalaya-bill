-- Nandalaya: Seed sizes, size_groups, and size_group_items
-- Run this in Supabase SQL Editor or via Management API

-- ── Sizes ──
INSERT INTO sizes (label, numeric_value) VALUES
  ('1', 1), ('2', 2), ('3', 3), ('4', 4),
  ('5', 5), ('6', 6), ('7', 7), ('8', 8), ('9', 9),
  ('10', 10), ('11', 11), ('12', 12), ('13', 13),
  ('14', 14), ('15', 15), ('16', 16), ('17', 17), ('18', 18),
  ('20', 20), ('22', 22), ('24', 24), ('26', 26), ('28', 28),
  ('30', 30), ('32', 32), ('34', 34), ('36', 36), ('38', 38),
  ('40', 40), ('42', 42), ('44', 44),
  ('S', 1), ('M', 2), ('L', 3),
  ('Small', 1), ('Large', 2);

-- ── Size Groups ──
INSERT INTO size_groups (name, sort_order) VALUES
  ('SHIRT', 1),
  ('HALF_PANT', 2),
  ('PANT', 3),
  ('TSHIRT', 4),
  ('TUNIC', 5),
  ('SKIRT', 6),
  ('BLAZER', 7),
  ('SWEATER', 8),
  ('SHOE_KIDS', 9),
  ('SHOE_ADULT', 10),
  ('STOCKINGS', 11),
  ('BELT', 12);

-- ── Size Group Items ──

-- SHIRT: 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('16',0),('18',1),('20',2),('22',3),('24',4),('26',5),('28',6),('30',7),('32',8),('34',9),('36',10),('38',11),('40',12),('42',13),('44',14)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'SHIRT';

-- HALF_PANT: 11, 12, 13, 14, 15, 16, 17, 18
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('11',0),('12',1),('13',2),('14',3),('15',4),('16',5),('17',6),('18',7)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'HALF_PANT';

-- PANT: 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('20',0),('22',1),('24',2),('26',3),('28',4),('30',5),('32',6),('34',7),('36',8),('38',9),('40',10),('42',11),('44',12)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'PANT';

-- TSHIRT: 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('22',0),('24',1),('26',2),('28',3),('30',4),('32',5),('34',6),('36',7),('38',8),('40',9),('42',10),('44',11)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'TSHIRT';

-- TUNIC: 22, 24, 26, 28, 30, 32, 34, 36, 38, 40
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('22',0),('24',1),('26',2),('28',3),('30',4),('32',5),('34',6),('36',7),('38',8),('40',9)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'TUNIC';

-- SKIRT: 14, 16, 18, 20, 22, 24, 26, 28
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('14',0),('16',1),('18',2),('20',3),('22',4),('24',5),('26',6),('28',7)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'SKIRT';

-- BLAZER: 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('22',0),('24',1),('26',2),('28',3),('30',4),('32',5),('34',6),('36',7),('38',8),('40',9),('42',10)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'BLAZER';

-- SWEATER: 24, 26, 28, 30, 32, 34, 36, 38, 40, 42
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('24',0),('26',1),('28',2),('30',3),('32',4),('34',5),('36',6),('38',7),('40',8),('42',9)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'SWEATER';

-- SHOE_KIDS: 10, 11, 12, 13, 1, 2, 3, 4
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('10',0),('11',1),('12',2),('13',3),('1',4),('2',5),('3',6),('4',7)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'SHOE_KIDS';

-- SHOE_ADULT: 5, 6, 7, 8, 9, 10, 11
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('5',0),('6',1),('7',2),('8',3),('9',4),('10',5),('11',6)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'SHOE_ADULT';

-- STOCKINGS: S, M, L
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('S',0),('M',1),('L',2)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'STOCKINGS';

-- BELT: Small, Large
INSERT INTO size_group_items (size_group_id, size_id, sort_order)
SELECT sg.id, s.id, row_number() OVER ()
FROM size_groups sg, (VALUES ('Small',0),('Large',1)) AS v(label, ord)
JOIN sizes s ON s.label = v.label
WHERE sg.name = 'BELT';

-- ── Verify ──
SELECT sg.name AS size_group, COUNT(sgi.size_id)::int AS size_count
FROM size_groups sg
LEFT JOIN size_group_items sgi ON sgi.size_group_id = sg.id
GROUP BY sg.name, sg.sort_order
ORDER BY sg.sort_order;
