# Factory Operations & Quality Control System

A Django-based factory quality-control application developed for the Zapuza Technologies assignment. The application supports product registration, measurement inspections, supervisor decisions, production operation tracking, and dispatch validation.

## Features

### 1. Product Management
- Register products with unique serial numbers.
- View product records and creation dates.

### 2. Quality Inspections
- Record product measurements against defined minimum and maximum limits.
- Automatically classify measurements as `PASS` or `FAIL`.
- View inspection history through Django Admin.

### 3. Inspection Approvals
- Record supervisor approval or rejection for an inspection.
- Store supervisor details and remarks.
- Review approval records through Django Admin.

### 4. Production Operations
- Configure operation names and sequence numbers.
- Track pending, started, and completed operations.
- Configure hold periods for operations.

### 5. Dispatch Validation
- Block dispatch when inspections are missing, failed, unapproved, or rejected.
- Require production operations to be configured and completed.
- Block dispatch while a configured hold period has not elapsed.

### 6. Dashboard
- View product and inspection totals.
- Review recent inspection results and product records.
- Navigate to administration forms.

## Technology Stack

- **Language:** Python
- **Framework:** Django 6.1.2
- **Database:** SQLite
- **Frontend:** Django Templates, HTML, CSS
- **Testing:** Django automated test framework

## Prerequisites

- Python 3.13 or a compatible Python version
- pip

## Installation and Setup

Run the commands below from the `django_app` directory.

### 1. Create a virtual environment

```bash
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Apply database migrations

```bash
python manage.py migrate
```

### 4. Create an administrator account

```bash
python manage.py createsuperuser
```

### 5. Run the development server

```bash
python manage.py runserver
```

Open the dashboard at http://127.0.0.1:8000/ and the administration interface at http://127.0.0.1:8000/admin/.

## Automated Tests

Run:

```bash
python manage.py test quality
```

**Latest verified result:** 7 tests passed.

The automated tests cover inspection PASS/FAIL classification, dispatch blocking for failed or unapproved inspections, missing or incomplete production operations, and hold-period validation.

## Project Structure

```text
django_app/
├── config/
├── quality/
│   ├── migrations/
│   ├── templates/
│   │   └── quality/
│   │       └── dashboard.html
│   ├── admin.py
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── manage.py
└── requirements.txt
```

## Limitations

This implementation covers selected quality-control workflows and does not claim to implement every requirement in the original Business Requirements Document. Further work may be required for dedicated workflow forms, role-based permissions, enforcement of the required Final PDI inspection, and complete workflow sequencing.

## Demo Video

https://youtu.be/YVA43ZzeJ50

## Author

U J Krishna
