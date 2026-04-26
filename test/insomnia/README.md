# Insomnia export

`uu_slist_BE.insomnia.json` is the Insomnia v4 export for this project's REST API.

## Import

1. Open Insomnia → **Application menu → Import** (or `Cmd-O`).
2. Choose **From File** and pick `uu_slist_BE.insomnia.json`.
3. The collection **uu-slist-BE** is created with folders:
   - **User** — register, login, login (admin), get, update, delete
   - **Shopping Lists** — create, list, get, update, delete, addMember, removeMember, leave
   - **List Items** — create, update, setCompleted, delete
   - **Negative Cases** — 401 / 400 / 403 / 404 / 409 envelopes

## Environment

The base environment is `Local` (`baseUrl = http://localhost:3000`). Variables you'll fill as you test:

| Var              | Source                                                 |
| ---------------- | ------------------------------------------------------ |
| `token`          | `data.token` from `POST /user/login`                   |
| `userId`         | `data.user.id` from `POST /user/login`                 |
| `listId`         | `data.id` from `POST /shoppingList/create`             |
| `itemId`         | `data.item.id` from `POST /shoppingList/item/create`   |
| `memberUserId`   | id of a second registered user (for addMember/remove)  |
| `regularEmail`   | account used for the standard run                       |
| `regularPassword`| password for `regularEmail`                            |
| `adminEmail`     | matches server `ADMIN_EMAIL` to land in Authorities    |
| `adminPassword`  | password for the admin account                         |

To edit: click the environment dropdown (top-left) → **Manage Environments** → edit `Local`. Paste the response value into the matching key, save, and the next request picks it up via `{{ _.varName }}`.

## Suggested run order

1. `POST /user/register` (regular user)
2. `POST /user/login` → copy `token`, `userId` into env
3. `POST /shoppingList/create` → copy `listId`
4. `POST /shoppingList/item/create` → copy `itemId`
5. Iterate on `item/update`, `item/setCompleted`, `list/get`, etc.
6. Run **Negative Cases** to confirm error envelopes.

## Re-export

Insomnia → right-click the **uu-slist-BE** workspace → **Export → Insomnia v4 (JSON)** → overwrite this file.
