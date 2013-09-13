class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  helper_method :logged_in?, :current_user

  rescue_from ActiveRecord::ActiveRecordError, :with => :handle_active_record_error

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
    !!current_user
  end

  def current_user
    @current_user ||= User.find_by_id(session[:user_id])
  end

  def handle_active_record_error(error)
    flash[:error] = error.message
    redirect_to(root_path)
  end
end
