class CreateExpenses < ActiveRecord::Migration
  def change
    create_table :expenses do |t|
      t.integer :user_id
      t.integer :category_id
      t.string :description
      t.decimal :amount

      t.timestamps
    end

    add_index :expenses, :user_id
    add_index :expenses, :category_id
  end
end
