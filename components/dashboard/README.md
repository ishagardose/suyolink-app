# Dashboard

The app route `app/(main)/dashboard.jsx` renders `screens/DashboardScreen.jsx`.

- `screens/`: the dashboard composition and shared screen state.
- `tabs/`: Home, MySuyo, Doer Suyo, and Wallet content.
- `hooks/`: request lists, wallet totals, filters, notifications, favorites, task actions, and toast state.
- `navigation/`: header, bottom navigation, sidebar, status navigation, and active-task banner.
- `cards/` and `lists/`: requested-task cards and accepted/completed/cancelled lists.
- `modals/` and `details/`: dialogs and the sections inside task details.
- `styles/`: styles grouped by feature, composed by `dashboard.styles.js` into the theme-aware style factory.
- `data/`: category options, display configuration, and existing fallback values.
- `utils/`: date and formatting helpers, screen dimensions, and animation constants.
- `notifications/`: inbox content, swipeable cards, and notification display mapping.

Shared theme code lives in `theme/`. Wallet and account components stay in their own feature folders.
