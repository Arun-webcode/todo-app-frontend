import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, NavParams } from '@ionic/angular';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-add-edit-task',
  templateUrl: './add-edit-task.page.html',
  styleUrls: ['./add-edit-task.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddEditTaskPage implements OnInit {
  task: Omit<Task, '_id'> = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'low'
  };
  isEditMode = false;
  originalTask: Task | null = null;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private taskService: TaskService
  ) { }

  async ngOnInit() {
    const taskToEdit = await this.navParams.get('task');
    if (taskToEdit._id) {
      this.originalTask = taskToEdit;
      this.task = {
        title: taskToEdit.title,
        description: taskToEdit.description,
        priority: taskToEdit.priority,
        status: taskToEdit.status
      };
      this.isEditMode = true;
    }
  }

  ionViewWillEnter() {
  }

  async saveTask() {
    if (!this.task.title.trim()) {
      return;
    }

    if (!this.task.description || !this.task.description.trim()) {
      this.task.description = 'No description';
    }

    try {
      if (this.isEditMode && this.originalTask) {
        await this.taskService.updateTask(this.originalTask._id!, this.task).toPromise();
      } else {
        await this.taskService.createTask(this.task).toPromise();
      }
      this.dismiss(true);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  }

  async dismiss(refresh = false) {
    await this.modalController.dismiss({ refresh });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
      default:
        return 'medium';
    }
  }
}


