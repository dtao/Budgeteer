class User < ActiveRecord::Base
  has_secure_password

  has_many :budgets
  has_many :expenses

  validates_presence_of   :name
  validates_presence_of   :email
  validates_uniqueness_of :email
  validates_presence_of   :password_digest
end
