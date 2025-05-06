<picture>
  <source 
    srcset="https://raw.githubusercontent.com/gemini-testing/gh-actions-testplane/ab95b1d961a81c6f15cb3e33d37a04665b66ba71/docs/images/logo-dark.svg" 
    media="(prefers-color-scheme: dark)"
  >
  <img 
    src="https://raw.githubusercontent.com/gemini-testing/gh-actions-testplane/ab95b1d961a81c6f15cb3e33d37a04665b66ba71/docs/images/logo-light.svg" 
    alt="Logo"
  >
</picture>
<br><br>
A GitHub Action for running Testplane end-to-end tests with enhanced CI capabilities and reporting features.

## Features

- 🚀 **Test Execution**: Run Testplane tests in CI environment
- 🧺 **Browser Caching**: Automatic caching of local browsers (when used)
- 📊 **Job Summary Integration**: Writes failed test statistics to GitHub Job Summary
- ⚙️ **Configurable**: Supports multiple package managers, browsers, test sets and grep patterns
- 📘 **Storybook Support**: Optional integration with @testplane/storybook plugin

## Usage

Basic implementation in your workflow:

```yaml
- name: Run Testplane tests
  uses: gemini-testing/gh-actions-testplane@v1
  with:
    package-manager: 'pnpm'              # Optional
    config-path: 'testplane.ci.conf.ts'  # Optional
    browser: 'chrome,firefox'            # Optional
```

### Inputs

| Parameter             | Description                                      | Default               |
|-----------------------|--------------------------------------------------|-----------------------|
| `cwd`                 | Working directory for Testplane to run in       | `.`                   |
| `package-manager`     | Package manager (`npm`, `pnpm`, or `yarn`)      | `npm`                 |
| `html-report-prefix`  | Path prefix for HTML reports                    | `testplane-reports`  |
| `config-path`         | Custom Testplane config path                    | (empty)              |
| `storybook`           | Enable @testplane/storybook plugin              | (empty)              |
| `set`                 | Comma-separated list of test sets               | (empty)              |
| `browser`             | Comma-separated list of browsers                | (empty)              |
| `grep`                | Test selection pattern                          | (empty)              |

### Outputs

| Output             | Description                                      |
|--------------------|--------------------------------------------------|
| `html-report-path` | Path to generated HTML report                    |
| `exit-code`        | Exit code from Testplane execution               |

## Documentation

For complete setup instructions, report configuration and advanced use cases, see the [official documentation](https://testplane.io/docs/v8/guides/how-to-run-on-github).
