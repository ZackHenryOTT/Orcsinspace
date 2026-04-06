THIS REPO IS SET UP TO DEPLOY AS A STATIC SITE FROM THE REPO ROOT.

WHY:
The previous Netlify builds kept failing during npm install.
This layout bypasses Node/npm entirely for deploys.

WHAT NETLIFY SHOULD DEPLOY:
- index.html
- assets/
- multiclient-foundation/

WHERE THE SOURCE APP LIVES:
- source-app/

IMPORTANT:
Do NOT set a build command in Netlify.
Publish directory should be '.' (repo root) if Netlify asks.
