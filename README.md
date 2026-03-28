# Учебное руководство по Zero Framework

Добро пожаловать в ZeroFramework — легковесный DOM фреймворк, который работает на нативных возможностях браузера без внешних зависимостей. Это руководство поможет вам понять его основные концепции и создать ваше первое приложение.

## Концепция

**Zero** построен на идее "Zero Dependencies". Он не использует npm-пакеты в рантайме и работает напрямую в современных браузерах благодаря ES-модулям, `Proxy` и DOM API. Основная цель — предоставить простую среду для создания компонентных приложений.

## Основные понятия

### 1. Функция `h` (Виртуальный DOM)

Для описания структуры интерфейса используется функция `h`. Она создает "виртуальный узел" — простое представление DOM-элемента в виде JavaScript-объекта.

`h(tag, props, ...children)`
*   `tag`: Имя тега (например, `'div'`, `'h1'`). Может быть также функциональным компонентом или классом-компонентом.
*   `props`: Объект с атрибутами (например, `{ class: 'title' }`).
*   `children`: Массив дочерних элементов (текст или другие виртуальные узлы).

### 2. Компоненты

Компоненты — это строительные блоки вашего приложения. В Zero компонент — это класс, наследуемый от `Zero`, который имеет метод `render()`.

```javascript
import { Zero, h } from './zero.js';

class MyComponent extends Zero {
    render() {
        return h('h1', null, 'Привет, мир!');
    }
}
```

### 3. Реактивность (`this.state`)

Каждый компонент имеет объект `state`. Когда вы изменяете свойство этого объекта, компонент автоматически перерисовывается. Это достигается с помощью `Proxy`.

```javascript
class Counter extends Zero {
    constructor() {
        super();
        this.state = { count: 0 };
    }

    render() {
        return h('p', null, `Счетчик: ${this.state.count}`);
    }

    increment() {
        // Просто измените state, и DOM обновится!
        this.state.count++;
    }
}
```

### 4. Жизненный цикл

Вы можете управлять поведением компонента на разных этапах его существования с помощью методов жизненного цикла:
*   `onCreated()`: Вызывается до первого рендера.
*   `onMounted(element)`: Вызывается после того, как компонент добавлен в DOM.
*   `onUpdated()`: Вызывается после каждого обновления компонента.
*   `onUnmounted()`: Вызывается перед удалением компонента из DOM.

## Создание первого приложения: Трекер расходов

Давайте создадим простое приложение для отслеживания расходов.

### Шаг 1: Структура проекта

Создайте три файла:

*   `index.html` (точка входа)
*   `zero.js` (код фреймворка)
*   `app.js` (код вашего приложения)

### Шаг 2: Настройка `index.html`

Это основной HTML-файл. Он содержит элемент, куда будет вмонтировано наше приложение (`<div id="app"></div>`), и подключает `app.js` как модуль.

```html
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Трекер расходов на Zero</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="app.js"></script>
</body>
</html>
```

### Шаг 3: Фреймворк `zero.js`

Скопируйте код фреймворка, который вы создали, в этот файл. Он должен экспортировать как минимум `h`, `Zero` и `mount`.

### Шаг 4: Создание приложения в `app.js`

Это сердце нашего приложения. Мы импортируем необходимые функции из `zero.js`, создаем компонент `ExpenseTrackerApp` и монтируем его в DOM.

```javascript
import { Zero, h, mount } from './zero.js';

// --- Components ---

// Компонент для отображения одного расхода
function ExpenseItem(props) {
    return h(
        'li',
        { class: 'expense-item' },
        h('span', { class: 'expense-description' }, props.description),
        h('span', { class: 'expense-amount' }, `$${props.amount.toFixed(2)}`),
        h('button', { class: 'delete-btn', onclick: () => props.onDelete(props.id) }, '×')
    );
}

// --- Main App Component ---

class ExpenseTrackerApp extends Zero {
    constructor() {
        super();
        this.state = {
            expenses: [],
            description: '',
            amount: ''
        };
        this.handleDelete = this.handleDelete.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleDelete(id) {
        this.state.expenses = this.state.expenses.filter(exp => exp.id !== id);
    }
    
    handleSubmit(e) {
        e.preventDefault();
        if (!this.state.description || !this.state.amount) return;

        const newExpense = {
            id: Date.now(),
            description: this.state.description,
            amount: parseFloat(this.state.amount)
        };

        this.state.expenses = [...this.state.expenses, newExpense];
        
        this.state.description = '';
        this.state.amount = '';
        document.getElementById('description-input').value = '';
        document.getElementById('amount-input').value = '';
    }

    render() {
        const total = this.state.expenses.reduce((sum, exp) => sum + exp.amount, 0);

        return h(
            'div',
            { class: 'tracker-container' },
            h('h1', { class: 'main-title' }, 'Трекер расходов'),
            
            h('form', { class: 'expense-form', onsubmit: this.handleSubmit },
                h('input', { id: 'description-input', type: 'text', placeholder: 'Описание', oninput: e => (this.state.description = e.target.value) }),
                h('input', { id: 'amount-input', type: 'number', placeholder: 'Сумма', step: '0.01', oninput: e => (this.state.amount = e.target.value) }),
                h('button', { type: 'submit' }, 'Добавить')
            ),

            h('ul', { class: 'expense-list' },
                ...this.state.expenses.map(expense => 
                    h(ExpenseItem, { ...expense, key: expense.id, onDelete: this.handleDelete })
                )
            ),
            
            h('div', { class: 'total-container' },
                h('strong', null, 'Итого:'),
                h('span', { class: 'total-amount' }, `$${total.toFixed(2)}`)
            )
        );
    }
}

// Mount the app
const root = document.getElementById('app');
mount(new ExpenseTrackerApp(), root);

```

### Шаг 5: Запуск!

Откройте `index.html` в вашем браузере. Теперь вы увидите полнофункциональный трекер расходов. Вы можете добавлять новые расходы, удалять существующие и видеть общую сумму. Все это работает благодаря реактивной системе Zero.

Поздравляем! Вы только что создали свое первое полезное веб-приложение с помощью Zero.
