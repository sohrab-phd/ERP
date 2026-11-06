CREATE INDEX p4a_unit_lot ON inventory.unit (installation_id, authority_scope, lot_id, unit_id);
CREATE INDEX p4a_unit_state ON inventory.unit (installation_id, authority_scope, state, unit_id);
CREATE INDEX p4a_unit_kind ON inventory.unit (installation_id, authority_scope, kind, unit_id);
CREATE INDEX p4a_unit_location ON inventory.unit (installation_id, authority_scope, location_id, unit_id);
CREATE INDEX p4a_legacy_code ON inventory.material_lot (installation_id, authority_scope, (internal_code COLLATE "C"), unit_id);
