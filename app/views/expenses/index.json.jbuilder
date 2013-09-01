json.array!(@expenses) do |expense|
  json.extract! expense, :category_id, :description, :amount
  json.url expense_url(expense, format: :json)
end
