class HomeController < ApplicationController
  def index
  end

  def register
    if request.post?
      user = User.create(user_params)
      login_user(user)
      return redirect_to(root_path)
    end
  end

  def login
    user = User.find_by_email(params[:email])
    if user.nil?
      return fail('No user account found -- have you registered yet?')
    end

    if !user.authenticate(params[:password])
      return fail('Uh oh, wrong password -- are you trying to be sneaky?')
    end

    login_user(user)
    return redirect_to(request.referrer || root_path)
  end

  def logout
    logout_user
    redirect_to(root_path)
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end
end
