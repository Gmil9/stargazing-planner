import searchIcon from '../assets/search_icon.png'
import calendarIcon from '../assets/calendar_icon.png'
import './Sidebar.css'

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <span className="sidebar-label">Location</span>
        <div className="sidebar-search">
          <img src={searchIcon} className="sidebar-icon" alt="" />
          <span className="sidebar-input-text">Denver, CO</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Date</span>
        <div className="sidebar-date">
          <span className="sidebar-value-text">5/31/26</span>
          <img src={calendarIcon} className="sidebar-icon-date" alt="" />
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Time</span>
        <div className="sidebar-time">
          <span className="sidebar-value-text">10:00 PM</span>
        </div>
      </div>
    </div>
  )
}
