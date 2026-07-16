# Authentication

Form Builder:

# Gleicher Nutzerbasis / OIDC

- Token werden ausgestellt, voll kompatibel
- Wie Nutzer mit richtigen Bereichtigungen onborden auf Platform, da alle Eitco Nutzer und vor allem neue Nutzer nur in eitco Gruppe dürfen --> mit Groups arbeiten und Mapping erlauben um Berechtigungen setzen zu können. Müssen wir aber eh machen, weil für Bgen auch sinnvoll

# API Keys

- Backend hat API Key für Account, dieser stellet API Keys mit lesendem Zugriff auf jeweilige Formulare aus. Kann Gültigkeit der Token und Scope selbst festlegen und revoken.
    - Nachteil: Alles gleicher User, problematisch, wenn Fronted Nutzer mit Name etc darstellen will, auch Änderungen schöner darstellbar
    - Vorteil: verhältnismäßig einfach implementierbar, da wir wahrshcienlich eh in ähnliche rFom brauchen
- Unser Backend unterstützt die Verwaltung und das Anlegen von Accounts mittels Backend API. Probleme Rechteverwaltung, Konzept muss existieren, dass Nutzergruppen durch Admin verwaltet werden können, um für diese Notizen Keys zu erstellen

# Identity Provider

- Educorvi Keycloak fügt externen Identity Provider hinzu, damit sind Nutzer bei uns im Keycloak und können wie im Fall 1 mittels groups bei uns im Backend landen

## Form Builder WebComponent:

### Schnittstellen:

- bevor oder wenn api key abgelaufen ist, returned event, damit Backend neuen api key ausstellen kann. Im Fall von SSO sollte da snicht notwendig sen
- event, falls Nutzer Form builder schließt, dann könnte aktueller UI Schem aund Json Schema stand zurückgegeben werden

Schnittstelle Webcomponent als Typscript package

## Print Schema:

- Text und Antwort drunter, bei Papier: auch links Frage, rechts Antwortfeld in Formular
- Größe des Textfeldes in PRintversion, wie viele Zeilen, wie breit

Print und Webversion viele Unterscheidungen, evtl seperate Ui Schemas, teils auch andere Titles für elemente, aber das wären json schem Änderungen, daher notfall ui schema title override

- Varianten: Aktuell ein fester key mit verschiednene Varianten (aktuell: Forks), aber evtl. auch mehrere Attribute sinnvoll
- Lässt sich da smit json schema und ifs abbilden? z.B versteckte felde rmit dne variableninhalten, dann werdne if rules ausgewerten und abhängig von diesen, passt sich json schema an.

- Divider Sorte: Einmal neue Seite, einmal Divider wie wir haben

- Array elemente: Option, wie viele Elemente

- Datei Upload Feld: hinweis, de ranlage beifügen oder so

# Authentication

- How to map KEycloak groups into application groups? Mapping function, use the same name? But then hierarchy is not possible. Also what to do if group doesnt exist yet? For this we need a system or admin accoutn which is initially created and for exmaple provisions the gorups in the database so users are automatically added

- 2 Keycloaks, Backend Anwendugn vertraut beidem
- Token Exchnage: 1 Kecloak druch Toekn vona nderme Keycloak austauschen kann Configuring and using token exchange https://www.keycloak.org/securing-apps/token-exchange
