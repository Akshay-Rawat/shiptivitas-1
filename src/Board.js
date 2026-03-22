import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      }
    };

    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
  }

  componentDidMount() {
    fetch('http://localhost:3001/api/v1/clients')
      .then(res => res.json())
      .then(clients => {
        this.setState({
          clients: {
            backlog: clients
              .filter(c => c.status === 'backlog')
              .sort((a, b) => a.priority - b.priority),

            inProgress: clients
              .filter(c => c.status === 'in-progress')
              .sort((a, b) => a.priority - b.priority),

            complete: clients
              .filter(c => c.status === 'complete')
              .sort((a, b) => a.priority - b.priority),
          }
        }, () => {
          this.initDragula();
        });
      })
      .catch(err => console.error('Failed to fetch clients:', err));
  }

  initDragula() {
    const { backlog, inProgress, complete } = this.swimlanes;

    this.drake = Dragula([
      backlog.current,
      inProgress.current,
      complete.current,
    ]);

    this.drake.on('drop', (el, target) => {

      // IMPORTANT: revert DOM change to avoid React conflict
      this.drake.cancel(true);

      let newStatus = 'backlog';
      if (target === inProgress.current) newStatus = 'in-progress';
      if (target === complete.current) newStatus = 'complete';

      const cardId = el.getAttribute('data-id');

      // calculate new priority
      const targetChildren = Array.from(target.children);
      const newPriority = targetChildren.indexOf(el) + 1;

      fetch(`http://localhost:3001/api/v1/clients/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          priority: newPriority,
        }),
      })
        .then(res => res.json())
        .then(updatedClients => {
          this.setState({
            clients: {
              backlog: updatedClients
                .filter(c => c.status === 'backlog')
                .sort((a, b) => a.priority - b.priority),

              inProgress: updatedClients
                .filter(c => c.status === 'in-progress')
                .sort((a, b) => a.priority - b.priority),

              complete: updatedClients
                .filter(c => c.status === 'complete')
                .sort((a, b) => a.priority - b.priority),
            }
          });
        })
        .catch(err => console.error('Failed to update client:', err));
    });
  }

  componentWillUnmount() {
    if (this.drake) this.drake.destroy();
  }

  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane
        name={name}
        clients={clients}
        dragulaRef={ref}
      />
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">

            <div className="col-md-4">
              {this.renderSwimlane(
                'Backlog',
                this.state.clients.backlog,
                this.swimlanes.backlog
              )}
            </div>

            <div className="col-md-4">
              {this.renderSwimlane(
                'In Progress',
                this.state.clients.inProgress,
                this.swimlanes.inProgress
              )}
            </div>

            <div className="col-md-4">
              {this.renderSwimlane(
                'Complete',
                this.state.clients.complete,
                this.swimlanes.complete
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }
}