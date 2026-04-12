String productRoleLabel(String? role, {required bool isCroatian}) {
  switch ((role ?? '').trim().toLowerCase()) {
    case 'super_admin':
    case 'superadmin':
      return isCroatian ? 'Nacionalni menadžer' : 'National Manager';
    case 'admin':
      return isCroatian ? 'Gradski menadžer' : 'City Manager';
    case 'manager':
      return isCroatian ? 'Partner parkirališta' : 'Lot Partner';
    case 'officer':
      return isCroatian ? 'Agent' : 'Agent';
    default:
      return role ?? '';
  }
}
