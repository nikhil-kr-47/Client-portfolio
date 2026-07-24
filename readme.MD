# Klaudia Kowalczyk — Portfolio

A responsive, animated one-page portfolio site. Pure HTML/CSS/JS — no build step, no dependencies to install, so it deploys straight to GitHub Pages.

## What's included
- `index.html` — page content and structure
- `style.css` — all styling, animations, and responsive layout
- `script.js` — scroll-reveal animations, animated stat counters, mobile nav

## Notes on content
- Bio, name, role, follower/post/following counts, and location tags are pulled from the client's real Instagram profile.
- Gallery images, brand collaboration names, testimonial quotes, and the secondary stats in the "Impact" section (engagement rate, mentees coached, countries reached) are **placeholder/demo content** — clearly marked with a footnote on the live page. Swap these for real assets before going live.
- To replace a gallery placeholder with a real photo, open `style.css`, find `.g-fill`, and instead of the gradient background, set `background-image: url('assets/your-photo.jpg'); background-size: cover; background-position: center;` on the specific `.g-item`.
- The contact form is static (front-end only, no backend). Wire it up to a service like Formspree, Getform, or a custom endpoint, or replace it with a simple `mailto:` link.

## Deploy on GitHub Pages
1. Create a new GitHub repository (e.g. `klaudia-portfolio`).
2. Upload `index.html`, `style.css`, and `script.js` to the root of the repo (drag-and-drop on github.com works, or `git push`).
3. Go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then **Save**.
6. Wait 1–2 minutes — your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`

## Local preview
Just open `index.html` in a browser — no server required. (Or use the VS Code "Live Server" extension for auto-reload while editing.)