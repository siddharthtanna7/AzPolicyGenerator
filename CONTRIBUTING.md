# Contributing to Azure Policy Generator

Thank you for your interest in contributing to Azure Policy Generator! This document provides guidelines and instructions for contributing.

## Updating Resource Types

The `data/resourceTypes.json` file contains Azure resource types and their properties. To update this file:

1. Use the Azure Resource Manager REST API:
   ```
   GET https://management.azure.com/subscriptions/{subscriptionId}/providers?api-version=2021-04-01
   ```

2. Or use Azure PowerShell:
   ```powershell
   Get-AzResourceProvider -ListAvailable
   ```

3. Or use Azure CLI:
   ```bash
   az provider list
   ```

You can also reference the [Azure REST API Specs repository](https://github.com/Azure/azure-rest-api-specs) for comprehensive property definitions.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. A clear title and description
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and operating system details

### Suggesting Enhancements

For feature suggestions:

1. Check if the enhancement has already been suggested
2. Provide a clear description of the proposed feature
3. Explain why it would be beneficial
4. Suggest implementation details if possible

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure your code passes any tests
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

### Pull Request Process

1. Ensure your PR includes only relevant changes
2. Update README.md or other documentation if necessary
3. The PR will be merged once it has been reviewed and approved

## Development Setup

1. Clone the repository
2. Open the project in your preferred code editor
3. No build tools are required as this is a static web application

## Coding Standards

### HTML
- Use semantic HTML elements
- Maintain proper indentation (2 spaces)
- Include ARIA attributes for accessibility

### CSS
- Follow the existing naming conventions
- Group related properties
- Use CSS variables for consistent theming

### JavaScript
- Follow consistent naming conventions
- Comment complex logic
- Use ES6+ features where appropriate
- Avoid unnecessary dependencies

## Testing

- Test your changes on multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile/tablet responsiveness
- Check accessibility features

## License

By contributing to Azure Policy Generator, you agree that your contributions will be licensed under the project's MIT License.

Thank you for contributing to the Azure Policy Generator project!