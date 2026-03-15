# Contributing to MedField CHW Platform

Thank you for your interest in contributing to MedField!

## 🤝 How to Contribute

### Reporting Bugs
1. Check if the bug is already reported in [Issues](https://github.com/Dickson32-cell/MedField_CHW_Platform/issues)
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

### Suggesting Features
1. Open a [Feature Request](https://github.com/Dickson32-cell/MedField_CHW_Platform/issues/new?template=feature_request.md)
2. Explain the use case
3. Describe potential solutions

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Add tests if applicable
5. Ensure code passes linting: `npm run lint`
6. Commit with clear messages
7. Push and create a PR

## 🛠 Development Setup

```bash
# Clone the repository
git clone https://github.com/Dickson32-cell/MedField_CHW_Platform.git
cd MedField_CHW_Platform

# Backend setup
cd backend
cp .env.example .env
npm install
npm run dev

# Dashboard setup
cd ../dashboard
npm install
npm start

# Mobile app
cd ../mobile-app
npm install
npm run android  # or: npm run ios
```

## 📋 Coding Standards

- **JavaScript**: Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- **Python**: Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use meaningful variable names
- Comment complex logic
- Write tests for new features

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Run specific test suite
npx jest tests/unit/auth.test.js
```

## 📝 Commit Messages

Use conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: improve code`
- `chore: maintenance`

## 🔒 Security

- Don't commit secrets or credentials
- Report security vulnerabilities privately
- Use environment variables for sensitive data

## 📜 License

By contributing, you agree that your contributions will be licensed under the GNU General Public License v3.

---

Questions? Open an issue or reach out to the maintainers.