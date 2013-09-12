class CreateBudgets < ActiveRecord::Migration
  def change
    create_table :budgets do |t|
      t.integer :user_id
      t.decimal :amount, :precision => 10, :scale => 2
    end

    add_index :budgets, :user_id
  end
end
