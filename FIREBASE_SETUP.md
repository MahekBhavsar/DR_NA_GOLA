# Firebase setup (one time, all free)

The code is ready. These steps are done in the Firebase console
(https://console.firebase.google.com -> project **drnagola-3983c**) and take about 5 minutes.

## 1. Create the admin login  (Authentication)
1. **Authentication -> Users -> Add user**. Enter your admin email and a strong password.
2. Copy that user's **User UID** (shown in the Users list).

## 2. Mark that user as admin  (Realtime Database)
1. **Realtime Database -> Data**. Hover the root and click **+**.
2. Name: `admins`  ->  click **+** next to it  ->  Name: *(paste the User UID)*, Value: `true`.

Result should look like:
```
admins
  └─ <your-uid>: true
```

## 3. Allow your website domains  (Authentication)
**Authentication -> Settings -> Authorized domains**: make sure `localhost` and your live domain
(for example `yourproject.vercel.app`) are listed. Add them if not.

## 4. Publish the security rules  (Realtime Database)
1. **Realtime Database -> Rules**.
2. Replace everything with the contents of `database.rules.json` from this project.
3. Click **Publish**.

> Do step 1 and 2 BEFORE step 4, otherwise you will lock yourself out of the admin panel.

## 5. (Optional) Nicer password-reset email
**Authentication -> Templates -> Password reset**: set the sender name to "Doctor Na Gola".

## Test
- Open `/admin`, log in with the admin email + password -> dashboard loads.
- Open `/login`, create a customer account, add something to the cart, place an order.
- `/track` shows only that customer's orders.

## Privacy check after publishing the rules ("customers see only their own orders")
Ask Claude to run these live with two throwaway customer accounts, or try them yourself in the browser console on any site page:
- Logged out:  `firebase.database().ref('orders').once('value')`  -> must fail with PERMISSION_DENIED
- Customer A:  `firebase.database().ref('orders').once('value')`  -> must fail (full list is admin only)
- Customer A:  orders queried with customer B's uid                -> must fail
- Customer A:  read / edit / delete one of B's orders              -> must fail
- Customer A:  change the status of A's own order                  -> must fail (admin only)
- Customer A:  create an order with B's uid, or with status "paid"  -> must fail
- Customer A:  read `users` or B's profile                          -> must fail
- Customer A:  read `userNotifications/<B's uid>`                   -> must fail
- Admin:       can read all orders, all customers, change status    -> must work

## Clean-up recommended
Older "payment done" messages were stored in the public `notifications` list with customer names and order IDs.
In Realtime Database -> Data -> `notifications`, delete any entries whose type is `payment-done` or `order-completed`.
