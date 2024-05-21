<div align="center">
  <h1>AI Engine SDK JS/TS</h1>
  <blockquote>A library to enable users to build custom AI Engine Applications</blockquote>

<a href="https://www.npmjs.com/package/@fetchai/ai-engine-sdk">
  <img src="https://badgen.net/npm/v/@fetchai/ai-engine-sdk?color=blue" alt="npm version">
</a>
<a href="https://github.com/fetchai/ai-engine-sdk-js">
  <img src="https://img.shields.io/github/last-commit/fetchai/ai-engine-sdk-js" alt="latest commit">
</a>
<a href="https://github.com/fetchai/ai-engine-sdk-js/actions">
  <img alt="Build Status" src="https://github.com/fetchai/ai-engine-sdk-js/workflows/Build/badge.svg?color=green" />
</a>
<a href="https://github.com/fetchai/ai-engine-sdk-js/actions">
  <img alt="Publish Status" src="https://github.com/fetchai/ai-engine-sdk-js/workflows/Publish/badge.svg?color=green" />
</a>

</div>

## ⭐️ Features

- Access to latest AI Engine features
- Simple and intuitive API
- Support for TypeScript and JavaScript
- Can run in the browser or via node

## 📦 Getting Started

```
npm install @fetchai/ai-engine-sdk
```

### Using the Chat API

```javascript
import { AiEngine } from '@fetchai/ai-engine-sdk';

const aiEngine = new AiEngine(apiKey, { apiBaseUrl });

const session = await aiEngine.createSession();
await session.start("Find a holiday destination");

...
```

## ✨ Contributing

All contributions are welcome! Remember, contribution includes not only code, but any help with docs or issues raised by other developers. See our [contribution guidelines](https://github.com/fetchai/ai-engine-sdk-js/blob/main/CONTRIBUTING.md) for more details.

### ❓ Issues, Questions, and Discussions

We use [GitHub Issues](https://github.com/fetchai/ai-engine-sdk-js/issues) for tracking requests and bugs, and [GitHub Discussions](https://github.com/fetchai/ai-engine-sdk-js/discussions) for general questions and discussion.
