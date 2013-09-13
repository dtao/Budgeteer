class ExpensesController < ApplicationController
  def index
    user = User.find(current_user[:id])
    budget = user.budgets.last
    expenses = user.expenses.order(:id => :desc)

    render(:json => {
      :budget => budget.try(:amount),
      :expenses => expenses.map { |expense|
        {
          :timestamp   => expense.created_at.utc.to_i * 1000,
          :amount      => expense.amount,
          :description => expense.description
        }
      }
    })
  end

  def create
    expense = Expense.create(expense_params)
    render(:json => expense)
  end

  private

  def expense_params
    params.require(:expense).permit(:amount, :description).merge(:user_id => current_user[:id])
  end
end
