class ExpensesController < ApplicationController
  def index
    budget = current_user.budgets.last
    expenses = current_user.expenses.order(:id => :desc)

    render(:json => {
      :budget => budget.try(:amount),
      :expenses => expenses.map(&self.method(:expense_to_json))
    })
  end

  def create
    expense = Expense.create(expense_params)
    render(:json => expense_to_json(expense))
  end

  private

  def expense_params
    params.require(:expense).permit(:amount, :description).merge(:user_id => current_user[:id])
  end

  def expense_to_json(expense)
    {
      :timestamp   => expense.created_at.utc.to_i * 1000,
      :amount      => expense.amount,
      :description => expense.description
    }
  end
end
