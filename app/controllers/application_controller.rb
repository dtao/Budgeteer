class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :logged_in?, :current_user

  protected

  def ensure_logged_in
    return redirect_to(login_path) unless logged_in?
  end

  def fail(message, route=nil)
    flash[:error] = message
    redirect_to(route || root_path)
  end

  def login_user(user)
    session[:user_id]    = user.id
    session[:user_name]  = user.name
    session[:user_email] = user.email
  end

  def logout_user
    session.delete(:user_id)
    session.delete(:user_name)
    session.delete(:user_email)
  end

  def logged_in?
    current_user[:id].present?
  end

  def current_user
    @current_user ||= {
      :id    => session[:user_id],
      :name  => session[:user_name],
      :email => session[:user_email]
    }
  end
end
