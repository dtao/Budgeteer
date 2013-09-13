class CreateExpenses < ActiveRecord::Migration
  def change
    create_table :expenses do |t|
      t.integer :user_id
      t.string  :description
      t.decimal :amount, :precision => 10, :scale => 2

      t.timestamps
    end

    add_index :expenses, :user_id
    add_index :expenses, :created_at
  end
end
