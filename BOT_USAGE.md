# 📱 Expenses Tracker Bot — Usage Guide

A complete guide on how to use the Expenses Tracker Telegram bot. Simply send messages to the bot in natural language to track your expenses!

---

## 🚀 Getting Started

1. Open Telegram and search for your bot (the one you created via [@BotFather](https://t.me/BotFather))
2. Press **Start** or send any message
3. The bot will automatically register you — no signup needed!

> **Tip:** Type `Help` or `?` at any time to see a quick reference of all commands.

---

## 💰 Supported Currency Formats

The bot uses **Indonesian Rupiah (Rp)** as the default currency. You can input amounts in several ways:

| Format | Example | Interpreted As |
|--------|---------|----------------|
| `Rp` prefix | `Rp50000` | Rp50.000 |
| `IDR` prefix | `IDR 100000` | Rp100.000 |
| `k` shorthand | `50k` | Rp50.000 |
| `rb` shorthand | `50rb` | Rp50.000 |
| `ribu` shorthand | `50ribu` | Rp50.000 |
| Plain number | `50000` | Rp50.000 |

---

## 📝 Add Expense (Debit)

Record a new expense by sending a message with an amount and description.

**Basic:**
```
Makan siang Rp50000
Kopi 15k
Bensin Rp75000
```

**With category:**
```
Kopi Rp15000 Category: Food
Belanja 200k Category: Shopping
Listrik Rp500000 Category: Utilities
```

**With notes:**
```
Makan siang Rp50000 Note: meeting with client Category: Food
```

The bot will respond with a confirmation showing the amount, description, date, category, and expense ID.

---

## 📥 Add Income (Credit)

Use credit keywords to record incoming money:

```
Gaji Rp5000000, Category: Income
Received Rp200000 from client
Dapat 500k Category: Income
```

**Credit keywords:** `received`, `income`, `earned`, `credit`, `salary`, `payment`, `terima`, `dapat`, `gaji`

---

## 👁️ View Expenses

View your recorded expenses with optional filters.

**Show recent expenses:**
```
Show expenses
Show last 10 expenses
Show last 20 expenses
```

**Filter by time period:**
```
Show expenses from today
Show expenses from yesterday
Show expenses from last week
Show expenses from this month
Show expenses from last month
```

**Filter by category:**
```
Show expenses Category: Food
Show expenses Category: Transportation
```

---

## ✏️ Edit Expense

Update an existing expense using its ID (shown when you add or view expenses).

**Change amount:**
```
Edit expense 123 Amount: Rp60000
```

**Change category:**
```
Update expense 123 Category: Food
```

**Change description:**
```
Edit expense 123 Description: Lunch with team
```

**Multiple changes at once:**
```
Edit expense 123 Amount: Rp75000 Category: Food Description: Team dinner
```

---

## 🗑️ Delete Expense

Remove an expense by its ID:

```
Delete expense 123
```

---

## 📊 Monthly Report

Generate a financial summary for a specific month.

**Current month:**
```
Show monthly report
Report
```

**Specific month:**
```
Generate report for January
Report for Maret
Laporan Februari
```

The report includes:
- Day-by-day breakdown of expenses and income
- Total expenses, total income, and net balance
- Transaction count

---

## 🏷️ Category Management

### View Categories
```
Show categories
```

### Add a Category
```
Add category Travel
Create category Entertainment
```

### Delete a Category
```
Delete category Travel
Remove category Entertainment
```

> **Note:** System categories (🔒) cannot be deleted. If a category is deleted, its expenses will still exist under "Uncategorized".

---

## 🗣️ Supported Languages

The bot understands both **English** and **Indonesian (Bahasa)** keywords:

| Feature | English | Indonesian |
|---------|---------|------------|
| Add expense | spent, bought, paid | bayar, beli |
| Add income | received, salary | terima, dapat, gaji |
| View | show, list, view | lihat, tampilkan |
| Edit | edit, update | ubah, ganti |
| Delete | delete, remove | hapus |
| Report | report, summary | laporan, ringkasan |
| Help | help | bantuan, tolong |
| Time | today, yesterday, last week | hari ini, kemarin, minggu lalu |

---

## 🏷️ Auto-Detected Categories

If you don't specify a category, the bot will try to detect one from your message:

| Category | Trigger Words |
|----------|--------------|
| Food | food, groceries, lunch, dinner, coffee, makan, makanan |
| Transportation | taxi, grab, gojek, fuel, parking, bensin, parkir |
| Entertainment | movie, cinema, game, netflix, hiburan, film |
| Utilities | electric, water, internet, phone, listrik, tagihan |
| Shopping | shopping, mall, shop, belanja, toko |
| Healthcare | hospital, doctor, medicine, dokter, obat |
| Income | salary, income, payment, gaji, pendapatan |

If no category is detected, the expense will be saved as **Uncategorized**.

---

## 💡 Tips & Tricks

1. **Use shorthand amounts** — `50k` is faster than `Rp50000`
2. **Categories are per-user** — Your categories won't affect other users
3. **Use explicit categories** — Add `Category: Food` for precise tracking
4. **Check your ID** — Each expense has a unique ID (shown on add/view) for editing and deleting
5. **Monthly reports** — Check your report regularly to stay on top of your finances
6. **Help anytime** — Just type `?` for a quick command reference
