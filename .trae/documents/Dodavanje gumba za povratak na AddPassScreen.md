## Implementacija gumba za povratak u AddPassScreen

1. **Izmjena UI-ja u [add_pass_screen.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/screens/add_pass_screen.dart)**:
   - Pronaći ću dio koda gdje se definira naslov "Add User Access".
   - Omotat ću naslov u `Row` widget.
   - Dodat ću `IconButton` s `Icons.arrow_back` na početak reda.
   - Postavit ću `onPressed` akciju na `Navigator.pop(context)`.

2. **Provjera konzistentnosti**:
   - Osigurat ću da gumb izgleda dobro i na mobilnim i na desktop uređajima, prateći `AppTheme`.
