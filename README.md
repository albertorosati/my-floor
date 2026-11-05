# ⚡ FLOOR ARENA // Dominio Vocale 1v1

Il game show vocale **1 contro 1 su un unico schermo** ispirato a *The Floor*, progettato per giocare **In Presenza** oppure **in condivisione schermo su Discord** e pensato per registrazioni su **YouTube** (audio 100% sintetizzato via Web Audio API, zero rischi di copyright).

## Caratteristiche Principali
- **Zero Conduttore Richiesto**: tutto avviene automaticamente su un unico schermo (Randomizer luminoso, conto alla rovescia 3-2-1, doppio timer al decimo di secondo, cambio turno istantaneo al riconoscimento della risposta e penalità di 3 secondi dicendo *"PASSO"*).
- **Riconoscimento Vocale Intelligente ("Anti-Cazzate")**:
  - Analisi istantanea su `interimResults` e sulle 5 alternative fonetiche del browser (latenza <100ms, non aspetta che tu finisca la frase).
  - Tolleranza automatica su articoli (`il`, `la`, `un`), singolare/plurale, doppie mancate e pronuncia italo-inglese grazie allo scheletro fonetico + distanza Damerau-Levenshtein.
- **Doppia Modalità Audio (In Presenza & Discord)**:
  1. **In Presenza / 1 Mic**: entrambi i giocatori parlano nello stesso microfono a turni alternati.
  2. **Proietto su Discord (Smart Mic P2P)**: l'Host condivide la finestra del gioco su Discord e invia il link rapido `?room=XXXX` al Giocatore 2. Il Giocatore 2 apre il link sul browser o telefono per trasmettere la propria voce in Peer-to-Peer diretto senza bisogno di cavi audio virtuali!
- **Studio Categorie & Pack per YouTube**:
  - **16 Categorie precaricate** (~270 elementi con sinonimi e grafica vettoriale ad altissima definizione).
  - **Editor Integrato**: crea nuove categorie caricando foto dal PC o incollando URL ed esporta/importa i tuoi pack in `.json`.

## Avvio Locale
```bash
npm install
npm run dev
```

## Pubblicazione Gratuita su GitHub Pages
Il progetto include già `.github/workflows/deploy.yml` e `base: './'` in `vite.config.ts`:
1. Collega questo progetto a un repository GitHub e fai push sul branch `main`.
2. Su GitHub vai in **Settings -> Pages -> Build and deployment -> Source** e seleziona **GitHub Actions**.
3. Ad ogni push, il gioco verrà pubblicato automaticamente su `https://<tuo-utente>.github.io/<nome-repo>/` con HTTPS attivo!
