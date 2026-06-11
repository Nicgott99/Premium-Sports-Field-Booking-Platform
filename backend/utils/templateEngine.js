/**
 * Simple template engine for rendering dynamic content
 */

class TemplateEngine {
  constructor() {
    this.templates = new Map();
    this.filters = new Map();
    this.helpers = new Map();
    this.registerDefaultFilters();
  }

  /**
   * Register template
   * @param {string} name - Template name
   * @param {string} template - Template string
   */
  register(name, template) {
    this.templates.set(name, template);
  }

  /**
   * Render template
   * @param {string} name - Template name
   * @param {object} data - Template data
   * @returns {string} Rendered template
   */
  render(name, data = {}) {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }

    return this.compile(template, data);
  }

  /**
   * Compile template string
   * @param {string} template - Template string
   * @param {object} data - Data context
   * @returns {string} Compiled output
   */
  compile(template, data = {}) {
    let output = template;

    // Replace variables {{ var }}
    output = output.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
      return this.evaluateExpression(expr.trim(), data);
    });

    // Replace conditionals {%if condition%}...{%endif%}
    output = output.replace(/\{%\s*if\s+([^%]+)%\}([\s\S]*?)\{%\s*endif\s*%\}/g, (match, condition, body) => {
      return this.evaluateCondition(condition.trim(), data) ? body : '';
    });

    // Replace loops {%for item in array%}...{%endfor%}
    output = output.replace(/\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, (match, item, array, body) => {
      return this.renderLoop(item, array, body, data);
    });

    return output;
  }

  /**
   * Evaluate expression
   * @param {string} expr - Expression
   * @param {object} data - Data context
   * @returns {string} Result
   */
  evaluateExpression(expr, data) {
    // Handle filters
    if (expr.includes('|')) {
      const [variable, ...filters] = expr.split('|').map(s => s.trim());
      let value = this.getValue(variable, data);

      filters.forEach(filter => {
        const [filterName, ...args] = filter.split(':');
        if (this.filters.has(filterName.trim())) {
          const filterFn = this.filters.get(filterName.trim());
          value = filterFn(value, ...args);
        }
      });

      return String(value);
    }

    // Handle helpers
    if (expr.includes('(')) {
      const match = expr.match(/(\w+)\((.*)\)/);
      if (match) {
        const [, helperName, args] = match;
        if (this.helpers.has(helperName)) {
          const helper = this.helpers.get(helperName);
          return String(helper(args, data));
        }
      }
    }

    return String(this.getValue(expr, data) || '');
  }

  /**
   * Evaluate condition
   * @param {string} condition - Condition
   * @param {object} data - Data context
   * @returns {boolean} Result
   */
  evaluateCondition(condition, data) {
    const match = condition.match(/(\w+)\s*(===|==|!=|!==|>|<|>=|<=)\s*(.+)/);
    if (!match) return false;

    const [, left, operator, right] = match;
    const leftValue = this.getValue(left, data);
    const rightValue = this.getValue(right, data);

    switch (operator) {
      case '===': return leftValue === rightValue;
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      case '!==': return leftValue !== rightValue;
      case '>': return leftValue > rightValue;
      case '<': return leftValue < rightValue;
      case '>=': return leftValue >= rightValue;
      case '<=': return leftValue <= rightValue;
      default: return false;
    }
  }

  /**
   * Render loop
   * @param {string} item - Item variable
   * @param {string} arrayName - Array variable
   * @param {string} body - Loop body
   * @param {object} data - Data context
   * @returns {string} Rendered output
   */
  renderLoop(item, arrayName, body, data) {
    const array = this.getValue(arrayName, data) || [];
    if (!Array.isArray(array)) return '';

    return array.map(value => {
      const loopData = { ...data, [item]: value };
      return this.compile(body, loopData);
    }).join('');
  }

  /**
   * Get nested value
   * @param {string} path - Dot notation path
   * @param {object} data - Data context
   * @returns {*} Value
   */
  getValue(path, data) {
    return path.split('.').reduce((current, prop) => current?.[prop], data);
  }

  /**
   * Register filter
   * @param {string} name - Filter name
   * @param {function} fn - Filter function
   */
  registerFilter(name, fn) {
    this.filters.set(name, fn);
  }

  /**
   * Register helper
   * @param {string} name - Helper name
   * @param {function} fn - Helper function
   */
  registerHelper(name, fn) {
    this.helpers.set(name, fn);
  }

  /**
   * Register default filters
   */
  registerDefaultFilters() {
    this.filters.set('uppercase', (val) => String(val).toUpperCase());
    this.filters.set('lowercase', (val) => String(val).toLowerCase());
    this.filters.set('capitalize', (val) => String(val).charAt(0).toUpperCase() + String(val).slice(1));
    this.filters.set('trim', (val) => String(val).trim());
    this.filters.set('length', (val) => Array.isArray(val) ? val.length : String(val).length);
    this.filters.set('reverse', (val) => Array.isArray(val) ? [...val].reverse() : String(val).split('').reverse().join(''));
    this.filters.set('default', (val, defaultValue) => val || defaultValue);
    this.filters.set('json', (val) => JSON.stringify(val, null, 2));
  }
}

export const templateEngine = new TemplateEngine();

export default templateEngine;
