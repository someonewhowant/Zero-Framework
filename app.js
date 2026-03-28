import { Zero, h, mount } from './zero.js';

function renderExpenseItem(props) {
    return h(
        'li',
        { class: 'expense-item', key: props.id },
        h('span', { class: 'expense-description' }, props.description),
        h('span', { class: 'expense-amount' }, `$${props.amount.toFixed(2)}`),
        h(
            'button',
            { 
                class: 'delete-btn',
                onclick: () => props.onDelete(props.id) 
            },'×'
        )
    );
}

class ExpenseTrackerApp extends Zero {
    constructor() {
        super();

        this.state = {
            expenses: [
                { id: 1, description: 'Groceries', amount: 50.00 },
                { id: 2, description: 'Gas', amount: 35.50 },
                { id: 3, description: 'Coffee', amount: 4.25 }
            ],
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
    }

    render() {
        const total = this.state.expenses.reduce((sum, exp) => sum + exp.amount, 0);

        return h(
            'div',
            { class: 'tracker-container' },
            h('h1', { class: 'main-title' }, 'Трекер расходов'),
            
            h(
                'form',
                { class: 'expense-form', onsubmit: this.handleSubmit },
                h('input', {
                    id: 'description-input',
                    type: 'text',
                    placeholder: 'Описание',
                    value: this.state.description, // Bind value to state
                    oninput: e => (this.state.description = e.target.value)
                }),
                h('input', {
                    id: 'amount-input',
                    type: 'number',
                    placeholder: 'Сумма',
                    step: '0.01',
                    value: this.state.amount, // Bind value to state
                    oninput: e => (this.state.amount = e.target.value)
                }),
                h('button', { type: 'submit' }, 'Добавить')
            ),

            h(
                'ul',
                { class: 'expense-list' },
                ...this.state.expenses.map(expense => 
                    renderExpenseItem({ 
                        ...expense, 
                        onDelete: this.handleDelete 
                    })
                )
            ),
            
            h(
                'div',
                { class: 'total-container' },
                h('strong', null, 'Итого:'),
                h('span', { class: 'total-amount' }, `$${total.toFixed(2)}`)
            )
        );
    }
    
    onMounted() {
        console.log("Трекер расходов смонтирован!");
    }
}

const root = document.getElementById('app');
mount(new ExpenseTrackerApp(), root);
