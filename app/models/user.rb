class User < ActiveRecord::Base
  has_secure_password

  has_many :budgets
  has_many :expenses
end
